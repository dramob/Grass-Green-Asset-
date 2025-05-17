#!/usr/bin/env python

"""
Setup script for the Green Asset backend
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
import shutil

def setup_environment():
    """Set up the Python environment for the backend"""
    print("Setting up environment for Green Asset Backend...")
    
    # Check if Python is installed and has the correct version
    try:
        python_version = subprocess.check_output(
            ["python", "--version"]).decode().strip()
        print(f"Python version: {python_version}")
    except Exception as e:
        print(f"Error checking Python version: {e}")
        print("Please ensure Python 3.9+ is installed.")
        return False
    
    # Check if virtual environment exists, create if not
    venv_path = Path(".venv")
    if not venv_path.exists():
        print("Creating virtual environment...")
        try:
            subprocess.check_call([sys.executable, "-m", "venv", ".venv"])
            print("Virtual environment created successfully.")
        except Exception as e:
            print(f"Error creating virtual environment: {e}")
            return False
    else:
        print("Virtual environment already exists.")
    
    # Install requirements
    print("Installing requirements...")
    venv_python = str(venv_path / "bin" / "python")
    if not os.path.exists(venv_python):
        # Windows uses Scripts instead of bin
        venv_python = str(venv_path / "Scripts" / "python")
    
    try:
        subprocess.check_call([venv_python, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Requirements installed successfully.")
    except Exception as e:
        print(f"Error installing requirements: {e}")
        return False
    
    # Create necessary directories
    for dir_name in ["data", "logs"]:
        os.makedirs(dir_name, exist_ok=True)
        print(f"Created directory: {dir_name}/")
    
    # Check if .env file exists, copy from .env.example if not
    dotenv_path = Path(".env")
    dotenv_example_path = Path(".env.example")
    
    if not dotenv_path.exists() and dotenv_example_path.exists():
        shutil.copy(dotenv_example_path, dotenv_path)
        print("Created .env file from .env.example")
        print("NOTE: Please edit .env to add your API keys")
    
    print("\nSetup complete! You can now run the backend with:")
    print(f"  {venv_python} src/main.py")
    
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Setup the Green Asset backend")
    args = parser.parse_args()
    
    if setup_environment():
        print("\nSetup completed successfully.")
    else:
        print("\nSetup failed. Please check the errors above.")
        sys.exit(1)