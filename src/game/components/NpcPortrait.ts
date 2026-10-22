import type { VillageNpc } from '../data/village';
// Original implementation art: named village NPCs were not illustrated in the PDF.
export function npcPortrait(npc: VillageNpc): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 32 40');
  svg.setAttribute('class', 'npc-portrait');
  svg.setAttribute('aria-hidden', 'true');
  const hat =
    npc.accessory === 'hat'
      ? '<path d="M5 10h22v4H5zM9 5h14v6H9z" fill="#d8b66f"/><path d="M9 9h14v3H9z" fill="#83965c"/>'
      : npc.accessory === 'cap'
        ? '<path d="M7 7h18v6H7zM20 11h8v3h-8z" fill="#6ba6a0"/>'
        : '<path d="M8 14h6v5H8zM18 14h6v5h-6zM14 16h4" fill="none" stroke="#666e55" stroke-width="1"/><path d="M10 23h13v4H10z" fill="#e7e3cf"/>';
  svg.innerHTML = `<g shape-rendering="crispEdges"><ellipse cx="16" cy="37" rx="12" ry="2" fill="#35583a" opacity=".2"/><path d="M9 29h6v8H9zM18 29h6v8h-6z" fill="#43513d"/><path d="M7 22h18v11H7z" fill="${npc.clothes}"/><path d="M5 23h4v8H5zM24 23h4v8h-4zM8 9h17v15H8z" fill="${npc.skin}"/><path d="M7 6h18v6H7zM6 11h4v8H6zM23 11h3v8h-3z" fill="${npc.hair}"/><path d="M11 15h2v2h-2zM20 15h2v2h-2z" fill="#354435"/><path d="M14 21h5v1h-5z" fill="#a56f54"/>${hat}${npc.accessory === 'hat' ? '<path d="M10 25h12v8H10z" fill="#c7d2a1"/>' : npc.accessory === 'cap' ? '<path d="M10 25h12v7H10z" fill="#9dc4ba"/>' : '<path d="M27 23h2v14h-2z" fill="#796645"/>'}</g>`;
  return svg;
}
