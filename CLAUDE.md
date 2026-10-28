# How to build a weekly drop

This repo is G's public library of Claude Code workflows. It is a plugin marketplace: every workflow is its own plugin, so people install only the ones they want. Futureproof members and G's company clients both install from here.

**This repo is public.** Anyone on the internet can read every file in it.

## Trigger

G says "build this week's drop: [idea]" (or similar).

## Steps

1. **Name it.** Pick a short kebab-case name that says what it does (`rfp-bid-checklist`, not `drop-12`). Check `plugins/` so it doesn't clash.
2. **Branch.** `git checkout -b drop/<name>` from an up-to-date `main`.
3. **Copy the template.** `cp -R templates/workflow plugins/<name>`, then rename `skills/skill-name` to the skill's real name.
4. **Fill in `plugin.json`.** `name` must match the folder name. `description` is one sentence: the job it takes off your plate.
5. **Write the skill(s)** in `skills/<skill>/SKILL.md`. The `description` decides when Claude uses it, so name the phrases a person would actually say. One workflow can hold more than one skill if the job needs it.
6. **Write the README** in the drop format, in this order:
   - Outcome title: what you get, in plain words
   - The job it takes off your plate (1–2 sentences)
   - Setup steps
   - How to start it (an example phrase)
   - Walkthrough video: leave `VIDEO LINK` until G records it
   - "What would you change about this for your business?"
7. **List it** in `.claude-plugin/marketplace.json` under `plugins`:
   ```json
   { "name": "<name>", "source": "./plugins/<name>", "description": "<same sentence as plugin.json>" }
   ```
   Bump `metadata.version` (minor for a new workflow, patch for a fix).
8. **Add a row** to the Workflows table in the root `README.md`. Remove the "coming soon" row once the first real workflow is listed.
9. **Validate.** Run `claude plugin validate .` and `claude plugin validate plugins/<name>`. Fix every error.
10. **Run the public-safety check** below.
11. **Commit, push the branch, open a pull request.** G reviews and merges. Never push straight to `main`.

## Public-safety check (every drop)

Before committing, search the new files for anything that must not be public:

- Client or member names, company names, emails, phone numbers
- File paths from G's machine (`/Users/...`, `~/Documents/...`)
- API keys, tokens, passwords, webhook URLs, account IDs
- Prices, revenue, or anything from G's business brain

If the idea came from client work, rewrite it as a general workflow any business could use. Client-specific versions belong in that client's private repo, never here.

## Writing rules

- Write for people who are not developers. Plain words, short steps, no jargon without a one-line explanation.
- Fact-first descriptions. No hype, no "game-changer", no "unlock".
- A workflow must work for someone who has never seen G's workspace. If a skill needs a file or connector, the README setup steps say how to get it.
- Never include secrets. If a workflow needs a key, the skill asks the person for it at run time.
