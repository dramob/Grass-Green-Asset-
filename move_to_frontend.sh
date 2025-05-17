#!/bin/bash
# Move everything except .git, .claude, frontend and Archi.md to the frontend directory
cd /workspaces/Grass-Green-Asset-/
find . -maxdepth 1 -not -name "." -not -name ".git" -not -name ".claude" -not -name "frontend" -not -name "Archi.md" -not -name "move_to_frontend.sh" -exec mv {} frontend/ \;

# Remove any potential duplicate public/wallet-icons directory
if [ -d "public" ]; then
  if [ -d "frontend/public" ]; then
    if [ -d "public/wallet-icons" ] && [ -d "frontend/public/wallet-icons" ]; then
      cp -r public/wallet-icons/* frontend/public/wallet-icons/
    elif [ -d "public/wallet-icons" ] && [ ! -d "frontend/public/wallet-icons" ]; then
      mkdir -p frontend/public/wallet-icons
      cp -r public/wallet-icons/* frontend/public/wallet-icons/
    fi
  else
    mkdir -p frontend/public
    if [ -d "public/wallet-icons" ]; then
      cp -r public frontend/
    fi
  fi
  rm -rf public
fi

echo "Files moved to frontend successfully"