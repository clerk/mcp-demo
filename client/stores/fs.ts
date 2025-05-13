import fs from "node:fs"
import os from "node:os"
import path from "node:path"

interface OAuthClientInfo {
    clientId: string
    clientSecret: string
    callback: string
    authServerUrl: string
}

const fsStore: { [state: string]: OAuthClientInfo } = {}
const root = path.join(os.tmpdir(), '__mcp_demo')

export default {
    write: (k: string, v: OAuthClientInfo) => {
        fsStore[k] = v
        fs.writeFileSync(root, JSON.stringify(fsStore))
    },
    read: (k: string) => JSON.parse(fs.readFileSync(root, 'utf8'))[k],
    all: () => JSON.parse(fs.readFileSync(root, 'utf8')),
};