#!/bin/bash
#
# vrt-docker.sh
#
# YACT Copyright (C) 2026 Wojciech Polak
#
# This program is free software; you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the
# Free Software Foundation; either version 3 of the License, or (at your
# option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program.  If not, see <https://www.gnu.org/licenses/>.
#

set -eu

mode="${1:-compare}"
image="mcr.microsoft.com/playwright:v1.59.1-noble"
workdir="$(pwd)"
node_modules_volume="yact-vrt-node_modules"

case "$mode" in
  compare)
    vrt_command="npm ci && npm run e2e:vrt"
    ;;
  baseline)
    vrt_command="npm ci && npm run e2e:vrt:baseline"
    ;;
  *)
    echo "usage: $0 [compare|baseline]" >&2
    exit 1
    ;;
esac

docker run --rm --init --ipc=host \
  -e CI=1 \
  -e VRT=1 \
  -v "$workdir":/work \
  -v "$node_modules_volume":/work/node_modules \
  -w /work \
  "$image" \
  bash -lc "$vrt_command"
