export class FlightMarkerUtility {
    
    static getFlightMarker(heading: number, highlighted: boolean) : string {
        const basePath ='/assets/';
        if (heading >= 337.5 || heading < 22.5) {
            return highlighted ? `${basePath}HL_North.png` : `${basePath}North.png`;
          } else if (heading >= 22.5 && heading < 67.5) {
            return highlighted ? `${basePath}HL_NorthEast.png` : `${basePath}NorthEast.png`;
          } else if (heading >= 67.5 && heading < 112.5) {
            return highlighted ? `${basePath}HL_East.png` : `${basePath}East.png`;
          } else if (heading >= 112.5 && heading < 157.5) {
            return highlighted ? `${basePath}HL_SouthEast.png` : `${basePath}SouthEast.png`;
          } else if (heading >= 157.5 && heading < 202.5) {
            return highlighted ? `${basePath}HL_South.png` : `${basePath}South.png`;
          } else if (heading >= 202.5 && heading < 247.5) {
            return highlighted ? `${basePath}HL_SouthWest.png` : `${basePath}SouthWest.png`;
          } else if (heading >= 247.5 && heading < 292.5) {
            return highlighted ? `${basePath}HL_West.png` : `${basePath}West.png`;
          } else {
            return highlighted ? `${basePath}HL_NorthWest.png` : `${basePath}NorthWest.png`;
          } 
    }
}