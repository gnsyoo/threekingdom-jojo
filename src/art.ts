export const assetUrl = (file: string) => `${import.meta.env.BASE_URL}assets/${file}`;
// A nested SVG clips one atlas cell before fitting it into a UI slot. Neither
// the cell's aspect ratio nor neighbouring portraits change with the slot size.
function atlasImage(file: string, sourceWidth: number, sourceHeight: number, rect: number[], label: string, className: string, fit = 'xMidYMin slice') {
  const [x, y, width, height] = rect;
  return `<svg class="${className}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="${fit}" role="img" aria-label="${label}"><svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" overflow="hidden"><image href="${assetUrl(file)}" width="${sourceWidth}" height="${sourceHeight}" /></svg></svg>`;
}
export function portraitHtml(id: string, name: string, className = ''): string {
  if (id === 'cao') return `<img class="painted-portrait ${className}" src="${assetUrl('cao-cao.png')}" alt="${name}" />`;
  const campaign = ['sun','hua','lubu'].includes(id);
  const cells: Record<string, [number, number]> = {liu:[0,0],guan:[1,0],zhang:[0,1],officer:[1,1],sun:[0,0],hua:[1,0],lubu:[0,1]};
  const [col, row] = cells[id] ?? cells.officer;
  const width = campaign ? 1356 : 1254, height = campaign ? 1159 : 1254;
  return atlasImage(campaign?'campaign-portraits.png':'portraits.png',width,height,[col*width/2,row*height/2,width/2,height/2],name,`painted-portrait portrait-atlas ${campaign?'portrait-campaign':''} portrait-${id} ${className}`);
}

export function formatGold(amount: number) {
  return new Intl.NumberFormat('ko-KR', amount < 1_000_000 ? {} : {notation:'compact',maximumFractionDigits:1}).format(amount);
}

const art: Record<string, string> = {
  move: '<g fill="#d2b579" stroke="#4b3826"><path d="m10 7 9-2 4 17-3 8-1 10 6 6-1 7-19 3-2-10 5-5 1-12Z"/><path d="m36 3 9 2-2 20 1 9 8 8-1 7-19 3-3-11 5-8-1-12Z"/></g><g stroke="#f7e0a3" stroke-width="2"><path d="m10 15 11-2M10 21l12-2M8 28l12-2M36 13l8 2M34 21l9 2M35 28l9 2"/></g>',
  sword: '<g stroke="#4d3925" stroke-width="1.5"><path d="m11 3 9 4 22 32-5 5L13 14Z" fill="#ebe9cd"/><path d="m46 3-9 4L15 39l5 5 24-30Z" fill="#bfc8b5"/><path d="m10 37 16 11-3 5L6 42Z" fill="#d7b06c"/><path d="m48 37-16 11 3 5 17-11Z" fill="#d7b06c"/><path d="m16 45-8 12M40 45l8 12" stroke="#987042" stroke-width="5"/></g>',
  scroll: '<g stroke="#6c512d" stroke-width="1.5"><path d="m15 6 25 7-15 36-25-7Z" fill="#dcc596"/><path d="m18 5 6 3-17 40-6-3Z" fill="#bda06c"/><ellipse cx="20" cy="7" rx="5" ry="3" fill="#ede0b5"/><path d="m40 13 5 3-16 36-5-2Z" fill="#a58651"/><path d="m22 18 12 4M18 25l12 4M15 32l12 4M19 12 14 9" stroke="#8b7957"/><path d="m15 28 21 8" stroke="#63523a" stroke-width="3"/></g>',
  potion: '<g stroke="#523b23" stroke-width="1.5"><path d="m21 13-8 9-7 17q-2 14 23 15 23-1 22-15l-8-17-7-9Z" fill="#b79a63"/><path d="m20 13 2-7h14l2 7Z" fill="#846338"/><path d="M17 19q12 4 25 0M18 22q-5 10-1 25M41 23q5 9 2 25" fill="none" stroke="#ecd29c"/><path d="M22 9h15M20 15h18" stroke="#e0c28a" stroke-width="3"/><circle cx="29" cy="35" r="7" fill="#d3b582"/><path d="M29 30v10M24 35h10" stroke="#875030" stroke-width="3"/></g>',
  wait: '<g fill="#ccac71" stroke="#4b3925" stroke-width="1.5"><path d="M9 48h43v6H9ZM15 44V28h30v16ZM12 23h36l-5-7H19ZM23 7h13v10H23Z"/><path d="M12 51h38M20 31h20M23 36h15" stroke="#eddbac"/></g>',
  flag: '<g stroke="#604324" stroke-width="1.5"><path d="M17 7h29l-7 10 8 10H17Z" fill="#d6b27a"/><path d="M15 4v51" stroke="#d6b27a" stroke-width="5"/><path d="m19 11 12 2-2 9-10-1Z" fill="#edcd91"/><path d="m15 52-5 5h11" stroke="#e3c69d" stroke-width="2"/></g>',
  armor: '<g fill="#abb3b6" stroke="#283b45" stroke-width="1.5"><path d="m20 8 9 6 10-6 12 11-7 8-5-4 3 28H17l3-28-5 4-7-8Z"/><path d="M23 18h14v24H23Z" fill="#70858a"/><path d="M20 30h20M20 36h20M19 43h22M29 15v36" stroke="#e8e5c9"/></g>',
  formation: '<g fill="#b4c6c1" stroke="#253e42" stroke-width="1.5"><circle cx="30" cy="13" r="7"/><circle cx="13" cy="28" r="6"/><circle cx="47" cy="28" r="6"/><path d="M20 38V27q10-13 20 0v11ZM3 52V42q10-14 20 0v10ZM37 52V42q10-14 20 0v10Z"/></g>',
  shop: '<g fill="#c8d1cd" stroke="#283e44" stroke-width="1.5"><path d="M10 25h40v28H10ZM5 22l11-9h28l11 9ZM17 11l-4-5h34l-4 5Z"/><path d="M18 34h9v19H18ZM34 33h9v9h-9Z" fill="#314a50"/><path d="M6 55h49M12 27h35" stroke="#e9dfb6" stroke-width="3"/></g>',
  coin: '<circle cx="30" cy="30" r="23" fill="#b38635" stroke="#edce7c" stroke-width="3"/><circle cx="30" cy="30" r="18" fill="#d1a74e" stroke="#785822"/><path d="M24 24h12v12H24Z" fill="#514727" stroke="#f4d991" stroke-width="2"/><path d="M19 16q13-8 23 5" stroke="#f5db9b" fill="none" stroke-width="2"/>',
};
export const artIcon = (name: string, size = 42) => `<svg class="art-icon" width="${size}" height="${size}" viewBox="0 0 60 60" aria-hidden="true">${art[name] ?? art.flag}</svg>`;
export const itemArt = (name: string, label: string) => {
  const rects:Record<string,number[]>={sword:[0,145,418,500],armor:[418,190,418,474],horse:[844,148,410,509],potion:[836,770,418,390]};
  return rects[name] ? atlasImage('items.png',1254,1254,rects[name],label,`item-art item-${name}`,'xMidYMid meet') : artIcon(name,64);
};
