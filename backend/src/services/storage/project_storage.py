"""
Project storage service
"""

import os
import json
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import threading
from pathlib import Path

from models.project import Project, project_to_dict, dict_to_project, ProjectStatus

logger = logging.getLogger(__name__)

class ProjectStorageService:
    """Service for storing and retrieving projects"""
    
    def __init__(self, data_dir: str = None):
        """
        Initialize the storage service
        
        Args:
            data_dir: Directory for storing data (default: src/../data)
        """
        self.data_dir = data_dir or os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
            "data"
        )
        self.projects_dir = os.path.join(self.data_dir, "projects")
        
        # Create directories if they don't exist
        os.makedirs(self.projects_dir, exist_ok=True)
        
        # Lock for thread safety
        self._lock = threading.Lock()
        
        logger.info(f"Project storage initialized at {self.projects_dir}")
        
    def save_project(self, project: Project) -> str:
        """
        Save a project to storage
        
        Args:
            project: Project to save
            
        Returns:
            Project ID
        """
        with self._lock:
            # Update the timestamp
            project.updated_at = datetime.now()
            
            # Convert to dict for serialization
            project_dict = project_to_dict(project)
            
            # Save to file
            file_path = os.path.join(self.projects_dir, f"{project.id}.json")
            with open(file_path, 'w') as f:
                json.dump(project_dict, f, indent=2)
            
            logger.info(f"Saved project {project.id} to {file_path}")
            return project.id
    
    def get_project(self, project_id: str) -> Optional[Project]:
        """
        Get a project by ID
        
        Args:
            project_id: ID of the project to retrieve
            
        Returns:
            Project if found, None otherwise
        """
        file_path = os.path.join(self.projects_dir, f"{project_id}.json")
        
        try:
            with open(file_path, 'r') as f:
                project_dict = json.load(f)
            
            return dict_to_project(project_dict)
        except FileNotFoundError:
            logger.warning(f"Project {project_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error loading project {project_id}: {e}")
            return None
    
    def list_projects(self, 
                     status: Optional[ProjectStatus] = None, 
                     company_name: Optional[str] = None) -> List[Project]:
        """
        List all projects, optionally filtered by status and company
        
        Args:
            status: Filter by status
            company_name: Filter by company name
            
        Returns:
            List of matching projects
        """
        projects = []
        
        for file_name in os.listdir(self.projects_dir):
            if not file_name.endswith('.json'):
                continue
                
            try:
                file_path = os.path.join(self.projects_dir, file_name)
                with open(file_path, 'r') as f:
                    project_dict = json.load(f)
                
                project = dict_to_project(project_dict)
                
                # Apply filters
                if status and project.status != status:
                    continue
                if company_name and project.company_name != company_name:
                    continue
                    
                projects.append(project)
            except Exception as e:
                logger.error(f"Error loading project from {file_name}: {e}")
        
        # Sort by creation date, newest first
        projects.sort(key=lambda p: p.created_at, reverse=True)
        return projects
    
    def delete_project(self, project_id: str) -> bool:
        """
        Delete a project
        
        Args:
            project_id: ID of the project to delete
            
        Returns:
            True if deleted, False otherwise
        """
        with self._lock:
            file_path = os.path.join(self.projects_dir, f"{project_id}.json")
            
            try:
                os.remove(file_path)
                logger.info(f"Deleted project {project_id}")
                return True
            except FileNotFoundError:
                logger.warning(f"Project {project_id} not found for deletion")
                return False
            except Exception as e:
                logger.error(f"Error deleting project {project_id}: {e}")
                return False
    
    def update_project_status(self, project_id: str, status: ProjectStatus) -> bool:
        """
        Update a project's status
        
        Args:
            project_id: ID of the project to update
            status: New status
            
        Returns:
            True if updated, False otherwise
        """
        with self._lock:
            project = self.get_project(project_id)
            if not project:
                return False
            
            project.status = status
            project.updated_at = datetime.now()
            
            self.save_project(project)
            return True