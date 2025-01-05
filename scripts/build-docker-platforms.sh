#!/bin/bash
#
# build-docker-platforms
#
# YACT Copyright (C) 2024-2025 Wojciech Polak
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

set -e

PLATFORMS=${PLATFORMS:-linux/amd64,linux/arm64}

# Split the platforms into an array
IFS=',' read -ra PLATFORM_ARRAY <<< "$PLATFORMS"

for PLATFORM in "${PLATFORM_ARRAY[@]}"; do
    # Check if the platform contains a slash
    if [[ $PLATFORM == *"/"* ]]; then
        ARCH=$(echo $PLATFORM | cut -d'/' -f2)
        OS=$(echo $PLATFORM | cut -d'/' -f1)
    else
        ARCH=$PLATFORM
        OS="linux"
        PLATFORM="${OS}/${ARCH}"
    fi

    # Construct image name without the OS prefix
    IMAGE_NAME="wap/yact/${ARCH}"

    set -xe
    docker build . -t $IMAGE_NAME --platform $PLATFORM
done
