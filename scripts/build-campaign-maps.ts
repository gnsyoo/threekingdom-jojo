/** Art direction references, never the shipped illustrated battlefield textures. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {SCENARIOS} from '../src/scenarios.ts';
const size=64;
const output=new URL('../qa-artifacts/map-layouts/',import.meta.url);
mkdirSync(output,{recursive:true});
for(const s of SCENARIOS){
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${s.cols*size}" height="${s.rows*size}" viewBox="0 0 ${s.cols*size} ${s.rows*size}"><defs><linearGradient id="grass" x2="1" y2="1"><stop stop-color="#5f7560"/><stop offset="1" stop-color="#72806a"/></linearGradient><linearGradient id="river" x2="0" y2="1"><stop stop-color="#3d7f91"/><stop offset="1" stop-color="#245e72"/></linearGradient><linearGradient id="rock" x2="1" y2="1"><stop stop-color="#aaa17f"/><stop offset="1" stop-color="#716e5f"/></linearGradient><pattern id="stipple" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M3 8h3m12 15h3M9 28h2" stroke="#d2d0a0" stroke-opacity=".2" stroke-width="1.3"/><path d="m22 4 2 3m-14 9 2-2" stroke="#234438" stroke-opacity=".24" stroke-width="1.2"/></pattern></defs><rect width="100%" height="100%" fill="url(#grass)"/><rect width="100%" height="100%" fill="url(#stipple)"/>`];
 for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++){
  const t=s.terrain[y][x];let art='';
  if(t==='road')art='<rect width="64" height="64" fill="#b6ad8d"/><path d="M0 12h64M0 52h64M16 0v12m24 40v12M9 31l13 2m21-11 9 2m-4 20-15-2" stroke="#8d8d75" stroke-opacity=".45" stroke-width="1.5"/>';
  if(t==='water')art='<rect width="64" height="64" fill="url(#river)"/><path d="M3 14q10 4 22 0m7 14q15 4 29-1M8 48q10 3 20-1" stroke="#b0d4cf" stroke-opacity=".34" stroke-width="1.5"/><path d="M0 6h64M0 60h64" stroke="#164b5c" stroke-opacity=".35" stroke-width="2"/>';
  if(t==='bridge')art='<rect width="64" height="64" fill="url(#river)"/><path d="M0 13h64v39H0z" fill="#aa9066" stroke="#514e40" stroke-width="2"/><path d="M5 14v37m9-37v37m9-37v37m9-37v37m9-37v37m9-37v37m9-37v37" stroke="#746449" stroke-width="1.7"/><path d="M0 9h64M0 55h64" stroke="#d0bc8a" stroke-width="4"/>';
  if(t==='forest')for(const [tx,ty,r] of [[15,17,13],[43,14,14],[31,39,16],[56,45,10],[9,52,9]])art+=`<path d="M${tx} ${ty+8}v${r}" stroke="#7a704e" stroke-width="3"/><ellipse cx="${tx}" cy="${ty+5}" rx="${r}" ry="${r*.85}" fill="#284f44"/><ellipse cx="${tx-2}" cy="${ty}" rx="${r*.84}" ry="${r*.72}" fill="#486c4d"/><path d="m${tx-7} ${ty} 5-5 6 3" stroke="#88a06b" stroke-opacity=".6" fill="none"/>`;
  if(t==='wall')art=['jieting','qishan','shangfang','yangping'].includes(s.arcId??s.id)?'<path d="m0 51 12-28 18-13 23 13 11 32v9H0Z" fill="url(#rock)" stroke="#666c5a" stroke-width="2"/><path d="m12 23 18-13 1 28-14 8m14-8 22-15-6 30" stroke="#c1b697" stroke-width="2" fill="none"/>':'<rect x="2" y="10" width="60" height="53" fill="#526366"/><path d="M0 11 6 2h10v9h12V2h10v9h11V2h11l4 9" fill="#71807c" stroke="#344d50" stroke-width="2"/><path d="M2 24h60M2 40h60M2 56h60M17 11v13m27-13v13M31 24v16M17 40v16m27-16v16" stroke="#94a395" stroke-opacity=".65" stroke-width="1.3"/>';
  if(t==='camp'||t==='village')art='<path d="M7 49h50v9H7Z" fill="#344a43" fill-opacity=".2"/><path d="M12 31h40v22H12Z" fill="#cab893" stroke="#786f54"/><path d="m6 31 26-22 26 22Z" fill="#3b565b" stroke="#d0b782" stroke-width="1.5"/><path d="M22 41h12v12H22Z" fill="#44564a"/><path d="M16 23h32M12 28h40" stroke="#89958b" stroke-width="1.3"/><path d="M53 9v29m1-28 8 2-3 5-5-1" fill="#b8885c" stroke="#d2bb81" stroke-width="1.3"/>';
  if(art)parts.push(`<g transform="translate(${x*size} ${y*size})">${art}</g>`);
 }
 // Camp flags along the starting area give each map an identifiable gathering point.
 for(const p of [s.deployment[0],s.deployment[2]])parts.push(`<g transform="translate(${p.x*64+8} ${p.y*64+4})"><path d="M0 2v22" stroke="#cebb87" stroke-width="2"/><path d="M1 2h13l-4 6 4 6H1Z" fill="#365d73" stroke="#b4c3a9" stroke-width="1"/></g>`);
 parts.push('</svg>');writeFileSync(new URL(`${s.id}.svg`,output),parts.join(''));console.log(`${s.id}.svg`);
}
