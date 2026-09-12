# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

First stable release of YACT (Yet Another Countdown Timer), a self-hosted
countdown timer PWA built with Next.js, React, and Tailwind CSS. It covers
the same ground as Big Timer, but runs on your own infrastructure, sends
nothing anywhere, and keeps working offline.

### Added

- Timer set in hours, minutes, and seconds.
- Two timer modes: fixed duration, and target time, which counts down to
  a specific clock time (e.g. 16:00:00).
- Repeat, with an optional break interval between cycles and a
  configurable break color.
- Count-up after the timer reaches zero.
- A sound when the timer ends, and an optional tick during the last
  10 seconds.
- Fullscreen mode.
- Screen wake lock, so the display stays on while a timer runs.
- Timer settings encoded in the URL hash, so a timer can be shared or
  bookmarked as a link.
- Preferences (sounds, notifications, theme) saved in the browser
  between sessions.
- Light and dark themes via `next-themes`.
- Responsive layout for desktop and mobile.
- Progressive Web App support with an offline service worker (Serwist),
  installable on supported platforms.
- Docker and Docker Compose deployment, with a prebuilt image published
  to GitHub Container Registry.
- Static export build for hosting on static sites such as GitHub Pages.
