import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const fsStore: { [state: string]: any } = {};
const root = path.join(os.tmpdir(), "__mcp_demo");

const store = {
  write: (k: string, v: any) => {
    fsStore[k] = v;
    fs.writeFileSync(root, JSON.stringify(fsStore));
  },
  read: (k: string) => {
    if (!fs.existsSync(root)) {
      fs.writeFileSync(root, "{}");
    }
    return JSON.parse(fs.readFileSync(root, "utf8"))[k];
  },
  all: () => JSON.parse(fs.readFileSync(root, "utf8")),
};

export default store;
