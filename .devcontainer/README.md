Dev container note
===================

This workspace uses the official dev container image `mcr.microsoft.com/devcontainers/node:18-bullseye`.

Why: the local `.devcontainer/Dockerfile` was removed to avoid transient Dockerfile parse errors during Codespace/devcontainer startup and to speed up environment provisioning.

Quick actions
-------------

- Rebuild the dev container in VS Code: open the Command Palette and run "Dev Containers: Rebuild Container".

- Start a local container from the published image:

```bash
docker run --rm -it -p 3000:3000 -v "$PWD":/workspace -w /workspace mcr.microsoft.com/devcontainers/node:18-bullseye /bin/bash
```

- To use a custom Dockerfile again: re-create `.devcontainer/Dockerfile` and change `devcontainer.json` back to using `"dockerFile": "Dockerfile"`.

Contact: if you want I can restore a customized Dockerfile with only the minimal changes you need.
