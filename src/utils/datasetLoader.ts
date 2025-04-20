/**
 * Functions for loading and accessing caption data from the dataset
 */

export interface CaptionFile {
  path: string;
  caption: string;
  fileName: string;
  folder: string;
}

/**
 * Loads the caption file data from the specified path
 */
export async function loadCaptionFile(path: string): Promise<string> {
  try {
    const response = await fetch(`http://localhost:3000/api/caption-content?path=${encodeURIComponent(path)}`);
    if (!response.ok) {
      throw new Error(`Failed to load caption file: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading caption file ${path}:`, error);
    return "";
  }
}

/**
 * Fetches a list of caption files from a directory
 */
export async function fetchCaptionFiles(directoryPath: string): Promise<CaptionFile[]> {
  try {
    const response = await fetch(`http://localhost:3000/api/captions?dir=${encodeURIComponent(directoryPath)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch caption files: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching caption files:", error);
    return [];
  }
}

/**
 * Gets a sample of caption files
 */
export async function getSampleCaptions(directoryPath: string, count: number = 10): Promise<CaptionFile[]> {
  const allCaptions = await fetchCaptionFiles(directoryPath);
  if (allCaptions.length <= count) {
    return allCaptions;
  }
  
  // Get a random sample
  const shuffled = [...allCaptions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
} 