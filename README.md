# deadlock-select-screen
<p align="center">
<img src="public/logo.png" width="100">
</p>

<p align="center">
The deadlock character selection screen recreated in a browser, using React.
</p>

<p align="center">
  <a href="https://nyx007nick.github.io/deadlock-select-screen_TH/">
    <img src="https://img.shields.io/badge/VISIT%20ON%20PAGES-blue?style=for-the-badge&logo=github">
  </a>
</p>

# WIP

# Deployment

To publish this fork, set **Settings > Pages > Build and deployment > Source** to **GitHub Actions**. Push to `main` to build and deploy the site to `https://nyx007nick.github.io/deadlock-select-screen_TH/`.

# Ability details data

Ability details and available official Thai character backstories are bundled locally from [deadlock-wiki/deadlock-data](https://github.com/deadlock-wiki/deadlock-data), so the popup and lore modal work without fetching data at display time. Characters without a Thai source translation show their existing English backstory with a notice. Refresh the snapshots with `npm run update:ability-data`; the generated datasets record their source revision and generation date.

### Thai voice samples

The existing EN/TH language choice also selects voice playback. English keeps using the original audio. Thai plays only generated clips present in `src/assets/voiceThaiManifest.json`; if a Thai clip is not available for the selected hero/action, no voice line is played rather than substituting English. To generate one authorized sample, put `ELEVENLABS_API_KEY` in the ignored `.env.local` file (never in the tracked `.env` file), then run `npm run dub:voice-sample -- <Hero> <selected|unselected> <source-file>`. For example, `npm run dub:voice-sample -- Mina selected select_01.opus` generates only that mapped source clip. To regenerate a mapped clip while emphasizing the source voice, add `--regenerate --cloning-strength 10`; for example, this can retry Haze's `select_01.opus` with maximum cloning strength. To generate one selected voice clip per hero, run `npm run dub:voice-sample -- --one-selected-per-hero`; it uses the first selected filename in `src/assets/vo_list.json`, skips heroes that already have a Thai selected clip, processes jobs sequentially, and saves each FLAC and transcript before starting the next. To generate one unselected clip only for heroes that already have a Thai selected clip, run `npm run dub:voice-sample -- --one-unselected-per-covered-hero`. Each generated clip may incur service charges.

# Tools used

- Credits to user **"Lovely"** for creating ["Deadlock Graphical Library"](https://forums.playdeadlock.com/resources/deadlock-graphical-library.30/updates) and uploading raw character renders. (Could not contact him because the project's Discord link is broken.)

- [Source2Viewer](https://s2v.app/): For game asset extraction, including music, 3D models, images, etc.

- [pngquant](https://github.com/kornelski/pngquant) & [oxipng](https://github.com/oxipng/oxipng): For image optimization and compression.

- [Blender](https://www.blender.org/download/): To create missing renders of characters (the ones that were not available at "Deadlock Graphical Library").

- **GIMP**: For image editing and manipulation, mainly composing the character renders and backgrounds.

# TO-DO

- Multiple character selection (Roster mode)
- Show info of character abilities
- Improve shadow animation of characters
- Maybe custom skins?
- Add proper optimization for resource loading (tiny thumbnails while full size image loads, preload, load screen maybe, etc.)

# DISCLAIMER

This project is not a playable game nor is intended to be a replacement of the original game, its only purpose is to showcase layout creation in HTML and CSS.
All original assets and characters belong to Valve and their respective owners.
