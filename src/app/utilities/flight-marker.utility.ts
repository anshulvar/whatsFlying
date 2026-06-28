export class FlightMarkerUtility {

  static createFlightSVG(heading: number, selected: boolean = false, dimmed: boolean = false): string {
    const rotation = heading || 0;
    const fill = selected ? '#FFD54F' : (dimmed ? '#546E7A' : '#4FC3F7');
    const stroke = selected ? '#F57F17' : (dimmed ? '#37474F' : '#01579B');
    const strokeW = selected ? '1.2' : '0.9';
    const opacity = dimmed ? '0.7' : '1';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-19 -22 38 40" width="22" height="22">
  <g transform="rotate(${rotation})" opacity="${opacity}">
    <path d="M0,-18 L4,-8 L16,-3 L9,3 L5,0 L3,6 L5,12 L0,14 L-5,12 L-3,6 L-5,0 L-9,3 L-16,-3 L-4,-8 Z"
          fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>
    <line x1="0" y1="-16" x2="0" y2="10" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
  </g>
</svg>`;
  }
}
