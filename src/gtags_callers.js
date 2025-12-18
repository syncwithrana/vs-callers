import { spawn } from "child_process";

/* ------------------ helpers ------------------ */

function runGlobal(args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn("global", args, { cwd });

    let out = "";
    let err = "";

    p.stdout.on("data", d => (out += d.toString()));
    p.stderr.on("data", d => (err += d.toString()));

    p.on("close", code => {
      if (code !== 0 && !out) {
        reject(err || `global ${args.join(" ")} failed`);
        return;
      }
      resolve(out);
    });
  });
}

function parseGlobalX(output) {
  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        symbol: parts[0],
        line: Number(parts[1]),
        file: parts[2],
        source: parts.slice(3).join(" ")
      };
    });
}

/* ------------------ cache ------------------ */

const fileFunctionCache = new Map();

/* ------------------ core logic ------------------ */

async function getFunctionsInFile(file, cwd) {
  if (fileFunctionCache.has(file)) {
    return fileFunctionCache.get(file);
  }

  const out = await runGlobal(["-xf", file], cwd);
  const funcs = parseGlobalX(out);

  fileFunctionCache.set(file, funcs);
  return funcs;
}

async function getEnclosingFunction(file, line, cwd) {
  const funcs = await getFunctionsInFile(file, cwd);
  return funcs.filter(f => f.line <= line).at(-1) || null;
}

async function getCallers(symbol, cwd) {
  const out = await runGlobal(["-rx", symbol], cwd);
  return parseGlobalX(out);
}

async function getCallersWithEnclosure(symbol, cwd) {
  const callers = await getCallers(symbol, cwd);

  for (const c of callers) {
    const enclosing = await getEnclosingFunction(c.file, c.line, cwd);
    c.enclosing = enclosing
      ? {
          name: enclosing.symbol,
          line: enclosing.line
        }
      : null;
  }

  return callers;
}

function mapByEnclosingFull(callers) {
  const map = new Map();

  for (const c of callers) {
    if (!c.enclosing) continue;

    const keyObj = {
      name: c.enclosing.name,
      file: c.file,          // enclosing function file
      line: c.line // enclosing function line
    };

    // stable string key
    const key = `${keyObj.name}|${keyObj.file}|${keyObj.line}`;

    if (!map.has(key)) {
      map.set(key, {
        enclosing: keyObj,
        callers: []
      });
    }

    map.get(key).callers.push(c);
  }

  return map;
}




/* ------------------ example usage ------------------ */

// run directly: node gtagsCallflow.js console_putc /path/to/project
if (process.argv.length >= 4) {
  const symbol = process.argv[2];
  const cwd = process.argv[3];

  (async () => {
    const result = await getCallersWithEnclosure(symbol, cwd);
    console.log(JSON.stringify(result, null, 2));
  })().catch(err => {
    console.error(err);
    process.exit(1);
  });
}


function getEnclosingInfoArray(callers) {
  return callers
    .filter(c => c.enclosing)
    .map(c => ({
      name: c.enclosing.name,
      file: c.file,
      line: c.enclosing.line
    }));
}

function getEnclosingInfoArray__(callers) {
  return callers
    .filter(c => c.enclosing)
    .map(c => c.enclosing.name);
}

/* ------------------ exports ------------------ */

export {
  getCallers,
  getCallersWithEnclosure,
  getEnclosingFunction,
  mapByEnclosingFull,
  getEnclosingInfoArray
};
