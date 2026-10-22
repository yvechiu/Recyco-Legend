// New vector item symbols for this implementation; these are not the original author's art.
const shapes: Record<string, string> = {
  cup: '<path d="M19 19h30l-4 37H24Z" fill="#f5e7bc"/><path d="M17 16h34v7H17Z" fill="#699c82"/><path d="M37 17 42 5h5" fill="none"/><path d="M25 37h20v10H25" fill="#c7855e"/>',
  pudding:
    '<path d="M15 24h38l-6 29H21Z" fill="#e9bd69"/><ellipse cx="34" cy="24" rx="20" ry="8" fill="#bf6c4c"/><path d="M24 34h20v12H24" fill="#fff0c1"/>',
  bottle:
    '<path d="M26 7h15v12l7 11v25H19V30l7-11Z" fill="#a0c9b3"/><path d="M25 5h17v8H25Z" fill="#3e877e"/><path d="M20 34h28v12H20Z" fill="#eee9bd"/><path d="M27 23v7" fill="none"/>',
  yogurt:
    '<path d="M24 13h20v11l5 11-4 21H23l-4-21 5-11Z" fill="#f0e4b9"/><path d="M23 11h22v7H23Z" fill="#bc674c"/><path d="M21 34h26v10H21" fill="#c57b50"/>',
  marker:
    '<path d="m18 49 20-32 12 8-21 33Z" fill="#6a9b78"/><path d="m38 17 6-10 12 8-6 10Z" fill="#d3b15f"/><path d="m18 49 11 9-12 3Z" fill="#e5d3ac"/>',
  toy: '<path d="M12 29h43v22H12Z" fill="#9bb6a5"/><path d="M24 15h19v18H24Z" fill="#c98561"/><circle cx="22" cy="52" r="7" fill="#516a61"/><circle cx="46" cy="52" r="7" fill="#516a61"/><path d="M29 19h9v8h-9Z" fill="#eadea7"/>',
  chips:
    '<path d="m17 9 8 3 8-3 8 3 8-3-1 47-8-2-9 3-8-3-7 3Z" fill="#d9ae5e"/><ellipse cx="33" cy="32" rx="12" ry="14" fill="#f7e6a7"/><path d="m26 33 5-8 9 11-8 5Z" fill="#be8050"/>',
  pencil:
    '<path d="m16 49 27-36 11 9-28 36Z" fill="#d6b66c"/><path d="m16 49 10 9-14 4Z" fill="#ecd9ad"/><path d="m43 13 6-8 11 9-6 8Z" fill="#c98273"/><path d="m22 51 24-31" fill="none"/>',
  mask: '<path d="M17 22c10-6 23-6 32 0v24c-10 6-23 6-32 0Z" fill="#9ac7c2"/><path d="M17 25C0 9 1 52 17 42m32-17c17-16 16 27 0 17M23 28h20M23 34h20M23 40h20" fill="none"/>',
  straw: '<path d="m20 57 20-40h13v-9H36L13 53Z" fill="#ce9565"/>',
  film: '<path d="m11 23 9-10 12 3 13-4 12 15-4 14-15 10-14-3-12-12Z" fill="#c1c7b2"/><path d="m19 22 25 17m-14-20 17 8" fill="none"/>',
  cap: '<path d="m20 47 15-29c4-8 20 0 16 8L35 56Z" fill="#ad8061"/><path d="m22 43 15 8" fill="none"/>',
};
export function itemIcon(symbol: string): SVGSVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('viewBox', '0 0 68 68');
  node.setAttribute('class', 'item-svg');
  node.setAttribute('aria-hidden', 'true');
  node.innerHTML = `<g stroke="#365748" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${shapes[symbol] || shapes.cup}</g>`;
  return node;
}
