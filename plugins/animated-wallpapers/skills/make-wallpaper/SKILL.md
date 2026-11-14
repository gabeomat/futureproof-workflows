---
name: make-wallpaper
description: Draws a new animated wallpaper for the Claude desktop and mobile apps from a description, checks it by looking at a picture of it, and adds it to the person's wallpaper picker. This skill should be used when someone says "make me a wallpaper", "create a wallpaper of a ...", "draw an animated background for Claude", "add a wallpaper to my picker", "/wallpaper new ...", or asks to change, remix or remove a wallpaper ("make the dragon bigger", "do Bubble Reef at night", "delete my dragon wallpaper").
---

# Make a wallpaper

A wallpaper is one SVG file drawn in code and animated with CSS. No image generator is involved: write the shapes, give them motion, look at the result, and add it to the picker the animated-wallpapers plugin puts in the app.

## What you need from the person

- What to draw. If the request names no subject at all, ask for one in a single question.

Decide everything else without asking: what moves, bright or night, the colors, the name.

## The tools

The plugin's mod provides five tools:

- `mcp__animated-wallpapers__preview_wallpaper`: takes a picture of a scene file
- `mcp__animated-wallpapers__add_wallpaper`: checks a wallpaper and adds it to the picker
- `mcp__animated-wallpapers__list_wallpapers`: lists what is in the picker
- `mcp__animated-wallpapers__export_wallpaper`: writes an existing wallpaper out as files
- `mcp__animated-wallpapers__remove_wallpaper`: removes one the person added

If they are not in the tool list, find them with tool search before concluding they are missing. If they cannot be found, follow "When the tools are missing" below.

## Steps

1. **Plan the scene.** Settle five things: the subject, three to five things that move, bright scene or night scene, a palette of five to seven colors, and where each thing sits. Tell the person the plan in one or two sentences, then keep going without waiting.
2. **Read `references/drawing-guide.md`** before writing any SVG. It holds the rules the app enforces, where things can sit so the chat does not cover them, and the animation patterns that work. Skipping it produces scenes that are refused or that hide behind the conversation.
3. **Draw it.** Start from `assets/scene-template.svg`. Save the scene as `scene.svg` in a work folder: `wallpaper-drafts/<short-name>/` under the current working directory, unless the person names another place.
4. **Look at it.** Call `preview_wallpaper` with the full path of `scene.svg`. It saves a picture beside it and answers with the picture's path. Read that picture and go through the checklist at the end of the drawing guide. Fix what is wrong and take the picture again. Then take one more at a different moment (`"at": 15`) and read that one too: compare the two to confirm that things moved and that nothing important is on screen only part of the time. A picture that was taken and not read checks nothing. Stop after three rounds of fixes and carry on.
5. **Describe it.** Write `wallpaper.json` beside the scene, in the format under "wallpaper.json" in the drawing guide: a name, the mode, one sentence saying what the scene shows, and the colors.
6. **Add it.** Call `add_wallpaper` with the full path of `wallpaper.json`. An answer starting "Not added yet" lists what to fix: fix exactly those things and add it again.
7. **Hand it back** as described below.

## Changing a wallpaper

To change one that exists ("make the dragon bigger", "do Bubble Reef at night"): call `export_wallpaper` with its name and a work folder, edit the files it writes, then look at it and add it as in steps 4 to 6.

- Adding under the same name replaces a wallpaper the person added.
- The six starters cannot be replaced. Give a changed starter a new name, such as "Bubble Reef at Night".
- The exported starters are also the best examples to study before drawing something ambitious.

## Removing a wallpaper

Call `remove_wallpaper` with its name. Only wallpapers the person added can be removed.

## When the tools are missing

The tools exist only while the animated-wallpapers plugin is loaded in this session.

- Say so plainly: the plugin needs to be installed, and a chat started after installing it.
- If the person still wants the wallpaper drawn now, write `scene.svg` and `wallpaper.json` as usual, and tell them to type `/wallpaper add` followed by the full path of `wallpaper.json` once the plugin is running.
- To look at the scene without the preview tool, run a Chromium-based browser from the shell if one is installed:
  `"<path to Chrome or Edge>" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --virtual-time-budget=6000 --screenshot="<folder>/scene.png" "file://<folder>/scene.svg"`

## What to hand back

Keep it short:

- The wallpaper's name and one sentence on what moves in it.
- That it is showing now, and that `/wallpaper` opens the picker to switch.
- That they can ask for changes in plain words.
- Where the draft files are. They can be deleted: the picker keeps its own copy.

Say what was not checked. If no picture could be taken, say the scene has not been seen and ask how it looks.

## Rules

- Draw original art. Take the feel of a place, a season or a kind of creature. Never draw a company's logo, a named character from a film, show, game or book, or a real person.
- No script, no web fonts, no images and nothing loaded from the web in the scene. The app would refuse or strip them.
- Do not add a wallpaper without looking at it first, unless no browser is available to take the picture.
- Never edit the plugin's own files. A person's wallpapers go in through `add_wallpaper` only.
- Wallpapers draw in the Claude desktop and mobile apps. A terminal draws none, so do not promise one there.
