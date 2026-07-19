const { RANKS } = require('./ranks');

const arabicDigits = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

function parseNum(value) {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/[٠-٩۰-۹]/g, (d) => arabicDigits[d] ?? d)
    .replace(/[,،\s_]/g, '');

  if (!/^\d+$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

function fmt(n) {
  return Number(n).toLocaleString('en-US');
}

function getRankByXp(xp) {
  let current = 1;
  for (const [rank, needXp] of Object.entries(RANKS)) {
    if (xp >= needXp) current = Number(rank);
  }
  return current;
}

function splitMessage(text, max = 1900) {
  const parts = [];
  let current = '';
  const sections = text.split('\n\n');

  for (const section of sections) {
    const add = current ? `\n\n${section}` : section;
    if ((current + add).length > max) {
      if (current) parts.push(current);
      if (section.length > max) {
        for (let i = 0; i < section.length; i += max) parts.push(section.slice(i, i + max));
        current = '';
      } else {
        current = section;
      }
    } else {
      current += add;
    }
  }

  if (current) parts.push(current);
  return parts;
}

function calculateRankList({ currentXp, targetRank, portAmount, xpPerItem }) {
  if (!Number.isSafeInteger(currentXp) || currentXp < 0) throw new Error('النقاط الحالية غير صحيحة.');
  if (!Number.isSafeInteger(targetRank) || !RANKS[targetRank]) throw new Error('اللفل المطلوب غير موجود في الجدول.');
  if (!Number.isSafeInteger(portAmount) || portAmount <= 0) throw new Error('عدد الحبات/الصناديق في الميناء غير صحيح.');
  if (!Number.isSafeInteger(xpPerItem) || xpPerItem <= 0) throw new Error('خبرة الحبة غير صحيحة.');

  const currentRank = getRankByXp(currentXp);
  const targetXp = RANKS[targetRank];
  const perPortXp = portAmount * xpPerItem;

  const header = [
    `📦 **حاسبة اللفل**`,
    `خبرتك الحالية: **${fmt(currentXp)}**`,
    `لفلك الحالي: **RANK ${currentRank}**`,
    `هدفك: **RANK ${targetRank}** = **${fmt(targetXp)}**`,
    `كل ميناء = **${fmt(portAmount)} صندوق**`,
    `كل صندوق = **${fmt(xpPerItem)} خبرة**`,
    `كل ميناء = **${fmt(perPortXp)} خبرة**`
  ];

  if (currentXp >= targetXp) {
    return `${header.join('\n')}\n\n✅ أنت واصل الهدف أو أعلى منه.`;
  }

  const remainingXp = targetXp - currentXp;
  const totalBoxes = Math.ceil(remainingXp / xpPerItem);
  const totalPorts = Math.ceil(totalBoxes / portAmount);
  const fullPorts = Math.floor(totalBoxes / portAmount);
  const extraBoxes = totalBoxes % portAmount;

  const lines = [];
  lines.push(header.join('\n'));
  lines.push([
    `الباقي للهدف: **${fmt(remainingXp)} خبرة**`,
    `يعني: **${fmt(totalBoxes)} صندوق**`,
    extraBoxes === 0
      ? `الخلاصة: تحتاج **${fmt(fullPorts)} ميناء كامل** وتدخل **RANK ${targetRank}** ✅`
      : `الخلاصة: تحتاج **${fmt(fullPorts)} ميناء + ${fmt(extraBoxes)} صندوق**، أو **${fmt(totalPorts)} موانئ كاملة** وتدخل **RANK ${targetRank}** ✅`
  ].join('\n'));

  for (let i = 1; i <= totalPorts; i++) {
    const before = currentXp + ((i - 1) * perPortXp);
    const after = before + perPortXp;
    const beforeRank = getRankByXp(before);
    const afterRank = getRankByXp(after);
    const nextRank = Math.min(beforeRank + 1, targetRank);

    const block = [];
    block.push(`**بعد ميناء ${i}:**`);
    block.push(`${fmt(before)} + ${fmt(perPortXp)} = **${fmt(after)}**`);

    if (afterRank > beforeRank) {
      const shownRank = Math.min(afterRank, targetRank);
      if (afterRank > beforeRank + 1 && shownRank > beforeRank + 1) {
        block.push(`تدخل من **RANK ${beforeRank + 1}** إلى **RANK ${shownRank}** ✅`);
      } else {
        block.push(`تدخل **RANK ${shownRank}** ✅`);
      }

      const nextAfterRank = Math.min(shownRank + 1, targetRank);
      if (shownRank < targetRank && RANKS[nextAfterRank]) {
        const remToNext = RANKS[nextAfterRank] - after;
        if (remToNext > 0) {
          block.push(`يبقى لك على ${nextAfterRank}: **${fmt(Math.ceil(remToNext / xpPerItem))} صندوق**`);
        }
      }
    } else {
      const remXp = RANKS[nextRank] - after;
      block.push(`ما تدخل **RANK ${nextRank}** ❌`);
      block.push(`يبقى لك على ${nextRank}: **${fmt(Math.ceil(remXp / xpPerItem))} صندوق**`);
    }

    lines.push(block.join('\n'));

    if (after >= targetXp) break;
  }

  return lines.join('\n\n');
}

module.exports = {
  parseNum,
  fmt,
  getRankByXp,
  splitMessage,
  calculateRankList
};
