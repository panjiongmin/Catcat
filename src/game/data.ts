import type { CoatId, PersId } from '../cats/catkit';
import { GROUND } from '../world/config';

export interface Cat {
  id: string;
  name: string;
  breed: string;
  coat: CoatId;
  pers: PersId;
  lv: number;
  mood: number;
  health: number;
  food: number;
  clean: number;
  /** Street position (world units). */
  x: number;
  y: number;
  /** One-off status line shown in the panel after an action. */
  msg?: string;
}

export const PERS_NAME: Record<PersId, string> = { lively: '活泼', cool: '高冷', lazy: '慵懒' };

export interface Building {
  x: number;
  y: number;
  name: string;
  kind: '设施' | '打工场所' | '装修中';
  desc: string;
  info: [string, string][];
}

export const state = { coins: 500, cap: 6 };

export const cats: Cat[] = [
  { id: 'huajuan', name: '花卷', breed: '三花猫', coat: 'calico', pers: 'lively', lv: 3, mood: 88, health: 92, food: 64, clean: 75, x: 640, y: 530 },
  { id: 'lizi', name: '栗子', breed: '缅因猫', coat: 'maine', pers: 'cool', lv: 8, mood: 72, health: 86, food: 38, clean: 60, x: 980, y: 520 },
  { id: 'lili', name: '狸狸', breed: '狸花猫', coat: 'lihua', pers: 'lazy', lv: 5, mood: 91, health: 88, food: 70, clean: 80, x: 1330, y: 540 },
];

export const buildings: Record<string, Building> = {
  home: { x: 800, y: GROUND, name: '我的家', kind: '设施', desc: '猫咪们吃饭、睡觉、晒太阳的地方。',
    info: [['人口', '3 / 6'], ['房屋等级', '客厅 Lv.1'], ['下一级', '解锁阳台，+2 猫位']] },
  shop: { x: 420, y: GROUND, name: '猫粮铺', kind: '设施', desc: '猫粮、猫砂、玩具和家具都在这里买。',
    info: [['猫粮', '20 猫币 · 饱食 +35'], ['猫砂', '10 猫币 · 清洁 +40'], ['新到', '猫爬架·云朵款']] },
  cafe: { x: 1210, y: GROUND, name: '猫咖', kind: '打工场所', desc: '最适合新手猫咪的工作，客人很温柔。',
    info: [['单班', '1 小时 · 60 猫币'], ['开放', '下一版开放派工']] },
  clinic: { x: 1900, y: GROUND, name: '宠物医院', kind: '设施', desc: '生病的猫咪在这里住院治疗，猫咪不会死掉，只会住院。',
    info: [['住院', '2 小时 · 80 猫币'], ['开放', '下一版开放']] },
  books: { x: 2240, y: GROUND, name: '书店 · 花店', kind: '装修中', desc: '还在装修，之后会开放更多玩法。',
    info: [['状态', '装修中']] },
  murder: { x: 2600, y: GROUND, name: '剧本杀', kind: '打工场所', desc: '猫咪扮演神秘角色，偶尔会“神演技”拿到额外打赏。',
    info: [['单班', '3 小时 · 200 猫币'], ['开放', '下一版开放派工']] },
  mystery: { x: 3040, y: GROUND, name: '密室逃脱', kind: '打工场所', desc: '收益最高也最累，下班后记得让猫好好休息。',
    info: [['单班', '8 小时 · 500 猫币'], ['开放', '下一版开放派工']] },
};

export interface Stray { id: string; x: number; y: number }
/** Cardboard boxes on the edges of the street; adoption opens in a later step. */
export const strays: Stray[] = [
  { id: 's1', x: 120, y: 512 }, { id: 's2', x: 2830, y: 512 }, { id: 's3', x: 3340, y: 512 },
];
