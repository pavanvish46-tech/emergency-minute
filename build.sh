#!/bin/bash
echo "Building Emergency Minute app..."

# Upgrade pip
pip install --upgrade pip

# Install dependencies (use Render requirements)
pip install -r requirements-render.txt

# Initialize database
python -c "
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized!')
"

echo "Build completed!"