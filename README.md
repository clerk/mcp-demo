# MCP Demo
### Uses Clerk for auth, implements the latest MCP draft spec

This repo provides a demo of how [the most recent draft of the MCP spec](https://modelcontextprotocol.io/specification/draft/basic/authorization#2-6-authorization-flow-steps) could work. As far as we know, no major LLM clients have implemented this version of the spec yet, so there is a test LLM client included in order to demonstrate the full flow, in addition to an application that includes the functionality of the authorization server, resource server, and MCP server combined.

### Running the Demo

The demo includes two separate apps - a **client**, and a **resource server**. To run them both, run `npm run deps` to install deps if this is the first time you're setting up the repo, then run `npm start`. If you'd like to run just one app or the other, `npm run client` and `npm run resource-server` will do the trick.

This demo uses [Clerk](https://clerk.com) for authentication. To ensure the Clerk setup works correctly, you will need to:
- Create [a new Clerk application](https://dashboard.clerk.com/apps/app_2vPiID331ZxCKtDWZEiuNCLYIN4/instances/ins_2vPiIE4V6YC4mE4jGkVe9J19znB) and drop the API keys for your app into the `resource-server/.env.local` file.
- Send an email to `support@clerk.com` requesting to be opted in to the early access program for oauth access tokens and dynamic client registration, and send the instance id for the app you'd like to use this with (you can get this out of the url, it starts with `ins_`). We will get you set up with this as quick as we can.
- If you'd like to test the "no dynamic client registration" mode, you will need to create an OAuth Application within your Clerk dashboard, which you can do so [by heading here](https://dashboard.clerk.com/last-active?path=oauth-applications), then creating an OAuth application, which will give you a client id and secret.

After this setup is complete, you should be able to run the entire demo using `npm start`. If you would like to integrate the resource server with an existing LLM client like claude, cursor, etc, you will need to use a fork of the `mcp-remote` package ([this one](https://www.npmjs.com/package/@jescalan/mcp-remote?activeTab=readme)) since at the moment no major LLM client supports remote auth for MCP servers, and the current version of `mcp-remote` does not send a state parameter with the authorization request, which Clerk's OAuth implementation rejects as it can be a security issue.

For example, in cursor, here's how you'd configure it

```
"Clerk MCP Demo": {
  "command": "npx",
    "args": [
      "@jescalan/mcp-remote",
      "http://localhost:3001/mcp",
      "--allow-http"
  ]
}
```

The resource server should be in a deploy-able state, but the demo client is not yet, as it uses a filesystem storage adapter. We're working on further abstracting and improving the client tooling to add a redis adapter which would make it deployable.

### Context

In the currently published version of the MCP spec, the recommendation is that MCP be handled by a separate server, which also handles authentication and authorization. In this model, there are three, sometimes four entities:

- Client: The LLM app - normally an AI chat app. For example, ChatGPT, Claude, Cursor, etc.
- Resource server: The application that the client is aiming to pull data from. For example, if a user of the client would like to install an integration that allows the LLM to access their emails from gmail, gmail would be considered the resource server, as it is the server that holds the resources the user is trying to make available to the client.
- MCP Server: A separate server that handles authentication between itself and the client, and between itself and the resource server. It receives MCP requests from the client, gets what it needs from the resource server, then returns an MCP-compatible response to the client.
- Authorization server: In some implementations, a separate service handles authentication/authorization for the resource server. In some, the resource server itself exposes the endpoints needed for auth. Regardless of whether this functionality is on a separate server or the same as the resource server, it is referred to as the authorization server.

There is one substantial change in the draft of the MCP spec, which is that **the MCP server is no longer responsible for handling authentication between the client and resource server**. It could still serve in this role, but it's not expected to do so, and the spec does not recommend it doing so. In this new version, the client is expected to authenticate directly with the resource server, then simply pass the OAuth token to the MCP server, which uses the token to get the data it needs from the resource server.

In the previous version of the spec, it felt somewhat justified to run an MCP server as a separate entity since handling authentication & authorization via OAuth is a fairly involved step that the vast majority of applications do not have already implemented themselves. However, after responsiblity for auth is removed from the MCP server, it no longer feels like it makes sense to run a separate server to handle MCP, rather than just adding an MCP endpoint to the resource server to handle these requests directly in most cases.

This is a good thing, as it reduces the complexity and the number of servers that need to be run in order to make things work properly. In this example, we are able to cut down the previous 3/4 servers to just two - the client, and the resource server. The resource server handles auth itself, and also hosts the MCP endpoint itself. In addition to reducing complexity and overhead, this approach also reduces latency and cost, making it a substantial upgrade over the previous architecture model.

### Tie-in with Clerk

[Clerk](https://clerk.com) is an authentication, authorization, and user management service, and we built this demo using Clerk because we work at Clerk, we like it, and because we think it provides a really clear example for how this setup can be run with minimal effort and cost. There is nothing that specifially ties it to Clerk though -- if you prefer to use another auth vendor, library, or build it yourself, that would work just fine here, so long as the vendor/library/code includes a spec-compliant OAuth2 server.

If you'd like to fork this demo and replace Clerk with another auth solution, we absolutely welcome it, and would be happy to link it as an alternative in the readme if you let us know. Our goal is to enable folks to build MCP integrations as easily and smoothly as possible, and while we feel like Clerk can be a great way to enable this, there are lots of great auth tools out there and we would be thrilled to see this working with as many of them as possible.
