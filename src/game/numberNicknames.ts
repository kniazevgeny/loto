const nicknames: Record<number, { fr: string; ru: string }> = {
  1: { fr: "le piquet", ru: "кол" },
  3: { fr: "la trinité", ru: "троица" },
  7: { fr: "la hachette", ru: "топорик" },
  10: { fr: "dans le mille", ru: "бычий глаз" },
  11: { fr: "les baguettes", ru: "барабанные палочки" },
  12: { fr: "la douzaine", ru: "дюжина" },
  13: { fr: "la douzaine du diable", ru: "чёртова дюжина" },
  22: { fr: "les oies sauvages", ru: "гуси-лебеди" },
  25: { fr: "encore vingt-cinq", ru: "опять двадцать пять" },
  40: { fr: "Ali Baba", ru: "Али-Баба" },
  66: { fr: "les bottes de feutre", ru: "валенки" },
  69: { fr: "les renversés", ru: "перевёртыши" },
  77: { fr: "les hachettes", ru: "топорики" },
  80: { fr: "la grand-mère", ru: "бабушка" },
  89: { fr: "le voisin du grand-père", ru: "дедушкин сосед" },
  90: { fr: "le grand-père", ru: "дедушка" },
};

export function numberNickname(number: number, language: string) {
  if (language !== "fr" && language !== "ru") return undefined;
  return nicknames[number]?.[language];
}
