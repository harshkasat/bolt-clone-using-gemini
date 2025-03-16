/**
 * Parse XML response from the /chat endpoint and convert it to a file structure
 * @param xmlString The XML string to parse
 * @returns An object with file paths as keys and file contents as values
 */
export function parseXmlToFileContents(xmlString: string): Record<string, string> {
    const fileContents: Record<string, string> = {};
    
    // Find all boltAction elements
    const actionRegex = /<boltAction\s+type="([^"]+)"(?:\s+filePath="([^"]+)")?\s*>([\s\S]*?)<\/boltAction>/gm;
    
    let match;
    while ((match = actionRegex.exec(xmlString)) !== null) {
      const actionType = match[1];
      const filePath = match[2];
      const content = match[3];
      
      // If it's a file action, add it to our fileContents
      if (actionType === "file" && filePath) {
        // Trim the content to remove leading/trailing whitespace
        fileContents[filePath] = content.trim();
      }
      // Note: We're ignoring shell actions for now
    }
    
    return fileContents;
  }
  
  /**
   * Extract all actions from the XML response
   * @param xmlString The XML string to parse
   * @returns An array of action objects
   */
  export function parseXmlToActions(xmlString: string): Array<{
    type: string;
    filePath?: string;
    content: string;
  }> {
    const actions: Array<{
      type: string;
      filePath?: string;
      content: string;
    }> = [];
    
    // Find all boltAction elements
    const actionRegex = /<boltAction\s+type="([^"]+)"(?:\s+filePath="([^"]+)")?\s*>([\s\S]*?)<\/boltAction>/gm;
    
    let match;
    while ((match = actionRegex.exec(xmlString)) !== null) {
      const actionType = match[1];
      const filePath = match[2];
      const content = match[3];
      
      actions.push({
        type: actionType,
        ...(filePath ? { filePath } : {}),
        content: content.trim()
      });
    }
    
    return actions;
  }
  
  /**
   * Parse the entire XML response containing boltArtifact
   * @param xmlString The XML string to parse
   * @returns An object with artifact ID, title, and actions
   */
  export function parseBoltArtifact(xmlString: string): {
    id: string;
    title: string;
    actions: Array<{
      type: string;
      filePath?: string;
      content: string;
    }>;
  } | null {
    // Find the boltArtifact element
    const artifactRegex = /<boltArtifact\s+id="([^"]+)"\s+title="([^"]+)">([\s\S]*?)<\/boltArtifact>/m;
    const artifactMatch = artifactRegex.exec(xmlString);
    
    if (!artifactMatch) {
      return null;
    }
    
    const id = artifactMatch[1];
    const title = artifactMatch[2];
    const artifactContent = artifactMatch[3];
    
    return {
      id,
      title,
      actions: parseXmlToActions(artifactContent)
    };
  }
  
  /**
   * Clean up the XML string by removing code block markers and extra whitespace
   * @param rawXml The raw XML string, possibly with code block markers
   * @returns A cleaned XML string
   */
  export function cleanXmlString(rawXml: string): string {
    // Remove code block markers if present
    let cleanedXml = rawXml.replace(/```(?:html|xml)?\n/g, '').replace(/```/g, '');
    
    // Remove any JSON wrapper if present
    try {
      const jsonObject = JSON.parse(cleanedXml);
      if (typeof jsonObject === 'object' && jsonObject !== null) {
        return cleanedXml = Object.values(jsonObject)[0] as string;
      }
    } catch (e) {
      // Not a JSON object, continue with the original string
    }
    
    return cleanedXml.trim();
  }
  
  /**
   * Main function to parse XML from the /chat endpoint response
   * @param rawResponse The raw response from the /chat endpoint
   * @returns An object with file paths as keys and file contents as values
   */
  export function parseResponse(rawResponse: string): Record<string, string> {
    const cleanedXml = cleanXmlString(rawResponse);
    return parseXmlToFileContents(cleanedXml);
  }