export interface MountInfo {
  colab_cli_installed: boolean;
  colab_cli_path: string | null;
  is_colab_native: boolean;
  mount_target: string;
  is_mounted: boolean;
  active_drive_path: string;
  is_fallback: boolean;
}

export interface SystemStatus {
  status: string;
  app_name: string;
  python_version: string;
  python_executable: string;
  mount: MountInfo;
}

export interface DriveItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string;
  is_gdoc: boolean;
  extension: string;
}

export interface DriveListing {
  current_path: string;
  base_path: string;
  exists: boolean;
  items: DriveItem[];
}

export interface FileData {
  found: boolean;
  name: string;
  path: string;
  size: number;
  modified: string;
  mime_type: string;
  is_binary: boolean;
  content: string;
}

export interface SandboxResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_seconds: number;
  script_id: string;
}
