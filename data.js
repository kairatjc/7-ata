/* ============================================================
   НОГОЙ САНЖЫРАСЫ — маалымат базасы
   ------------------------------------------------------------
   Ар бир "түйүн" (node) — бир кутуча.
   names  — ошол кутучадагы бир туугандар (эркектер).
   parent — атасынын кутучасынын id си (жебе кимден келгени).
   Оңдоо үчүн ушул файлды гана өзгөртсөңүз жетиштүү.
   ============================================================ */

const SANJYRA = [
  { id: "nogoi", parent: null, names: ["Ногой"], root: true },

  /* ── КАРАЧ тарабы ────────────────────────────────────────── */
  { id: "karach", parent: "nogoi", names: ["Карач"], branch: "karach" },

  { id: "yman",       parent: "karach", names: ["Ыман"] },
  { id: "yryskeldi",  parent: "karach", names: ["Ырыскелди"] },
  { id: "toktorbai",  parent: "karach", names: ["Токторбай"] },
  { id: "jumabai",    parent: "karach", names: ["Жумабай"] },
  { id: "kasmanbet",  parent: "karach", names: ["Касманбет"] },
  { id: "sarymsak",   parent: "karach", names: ["Сарымсак"] },
  { id: "akmomo",     parent: "karach", names: ["Акмомо"] },

  /* Ыман */
  { id: "y1", parent: "yman", names: ["Ашымбай", "Касымбай", "Алымбай", "Албай", "Молдалы", "Мырзабай"] },
  { id: "y2", parent: "y1",   names: ["Абылкасым", "Дүйшөкө", "Ыйсабай"] },
  { id: "y3", parent: "y2",   names: ["Алышбай"] },
  { id: "y4", parent: "y3",   names: ["Турдакун", "Жайлобай"] },
  { id: "y5", parent: "y4",   names: ["Бекиш", "Кеңеш"] },
  { id: "y6", parent: "y4",   names: ["Кайрат", "Талгат"] },
  { id: "y7", parent: "y5",   names: ["Азамат", "Салават", "Бекназар", "Чыңгыз"] },
  { id: "y8", parent: "y6",   names: ["Кутман", "Ислам"] },
  { id: "y9", parent: "y8",   names: ["Самат", "Нурмат"] },

  { id: "y10", parent: "y2",  names: ["Жээнбай", "Кубан"] },
  { id: "y11", parent: "y10", names: ["Жолдош", "Улан", "Эсен", "Турар", "Бекен"] },
  { id: "y12", parent: "y11", names: ["Бекжан"] },
  { id: "y13", parent: "y12", names: ["Кубат"] },
  { id: "y14", parent: "y11", names: ["Базыл"] },
  { id: "y15", parent: "y11", names: ["Кубан", "Дүйшөн", "Айып", "Жакыпбек", "Кайбылда", "Муса", "Бактыбек"] },
  { id: "y16", parent: "y15", names: ["Асылбек", "Жолдошбек"] },
  { id: "y17", parent: "y16", names: ["Азамат", "Саламат", "Самат"] },
  { id: "y18", parent: "y16", names: ["Базыл"] },
  { id: "y19", parent: "y15", names: ["Нуртилек"] },

  /* Ырыскелди */
  { id: "r1", parent: "yryskeldi", names: ["Жумадыл", "Мукаш", "Абышей"] },
  { id: "r2", parent: "r1", names: ["Абдыш"] },
  { id: "r3", parent: "r1", names: ["Сейтказы", "Жекшен"] },
  { id: "r4", parent: "r3", names: ["Асан"] },
  { id: "r5", parent: "r4", names: ["Талант", "Карый", "Арту"] },
  { id: "r6", parent: "r5", names: ["Таштан", "Талайбек", "Дамир"] },
  { id: "r7", parent: "r6", names: ["Дастан"] },
  { id: "r8", parent: "r6", names: ["Элнур", "Фархад", "Эрик"] },
  { id: "r9", parent: "r8", names: ["Базыл", "Байстан"] },
  { id: "r10", parent: "r8", names: ["Нурислам"] },
  { id: "r11", parent: "r5", names: ["Батабек"] },
  { id: "r12", parent: "r5", names: ["Марат", "Каныбек", "Жаныбек", "Канат"] },
  { id: "r13", parent: "r12", names: ["Айтбек", "Адилет"] },
  { id: "r14", parent: "r13", names: ["Курманбек", "Нурали"] },
  { id: "r15", parent: "r12", names: ["Акжол", "Аманбол"] },
  { id: "r16", parent: "r12", names: ["Байман", "Умар"] },

  /* Токторбай */
  { id: "t1", parent: "toktorbai", names: ["Кудайберген", "Телемуш", "Шаймерден"] },
  { id: "t2", parent: "t1", names: ["Кубан"] },
  { id: "t3", parent: "t2", names: ["Жумадыл"] },
  { id: "t4", parent: "t1", names: ["Калысбек", "Айбек"] },
  { id: "t5", parent: "t1", names: ["Бактыбек", "Асылбек"] },
  { id: "t6", parent: "t4", names: ["Адилет", "Арсен"] },

  /* Жумабай */
  { id: "j1", parent: "jumabai", names: ["Бөлөкбай"] },

  /* Касманбет */
  { id: "c1", parent: "kasmanbet", names: ["Касмалы"] },
  { id: "c2", parent: "c1", names: ["Казан", "Узак"] },
  { id: "c3", parent: "c2", names: ["Эмил", "Улан", "Нурлан"] },
  { id: "c4", parent: "c2", names: ["Элдар"] },
  { id: "c5", parent: "c3", names: ["Эмир"] },
  { id: "c6", parent: "c3", names: ["Женишбек", "Жылдызбек"] },
  { id: "c7", parent: "c6", names: ["Жолдошбек"] },

  /* Сарымсак */
  { id: "s1", parent: "sarymsak", names: ["Жоодар", "Марат"] },
  { id: "s2", parent: "s1", names: ["Нурдин"] },
  { id: "s3", parent: "s2", names: ["Кумарбек"] },
  { id: "s4", parent: "s1", names: ["Болот", "Акылбек", "Майрамбек", "Үмөтбек", "Асылбек"] },
  { id: "s5", parent: "s4", names: ["Бактыбек"] },

  /* Акмомо */
  { id: "a1", parent: "akmomo", names: ["Дүйшаалы"] },
  { id: "a2", parent: "a1", names: ["Алдаярбек", "Өмүрбек", "Асанбек", "Бактыгул", "Нургазы"] },
  { id: "a3", parent: "a2", names: ["Жаныбек"] },
  { id: "a4", parent: "a3", names: ["Курманбек"] },
  { id: "a5", parent: "a2", names: ["Адилет", "Арлен", "Арген"] },

  /* ── МАНАС тарабы ────────────────────────────────────────── */
  { id: "manas", parent: "nogoi", names: ["Манас"], branch: "manas" },

  { id: "ryskulbek", parent: "manas", names: ["Рыскулбек"] },
  { id: "tonkotoi",  parent: "manas", names: ["Тоңкотай"] },
  { id: "segizsary", parent: "manas", names: ["Сегизсары"] },
  { id: "kuron",     parent: "manas", names: ["Күрөң"] },

  /* Рыскулбек */
  { id: "p1", parent: "ryskulbek", names: ["Маана", "Жайлобай", "Сарыжаз"] },
  { id: "p2", parent: "p1", names: ["Максат"] },
  { id: "p3", parent: "p1", names: ["Эдилбек"] },
  { id: "p4", parent: "p3", names: ["Сагын"] },
  { id: "p5", parent: "p1", names: ["Мирбек", "Айбек", "Айдарбек"] },
  { id: "p6", parent: "p5", names: ["Акбар"] },

  { id: "p7", parent: "ryskulbek", names: ["Байсерке", "Жансерке"] },
  { id: "p8", parent: "p7", names: ["Урмаке"] },
  { id: "p9", parent: "p8", names: ["Эсенгул", "Исамидин", "Жумамидин", "Нурдулла", "Абзел", "Ишенбай", "Рахым", "Көлбай"] },
  { id: "p10", parent: "p9", names: ["Даулет"] },
  { id: "p11", parent: "p10", names: ["Айбек"] },
  { id: "p12", parent: "p9", names: ["Бакыт", "Мирбек", "Нурбек"] },
  { id: "p13", parent: "p12", names: ["Улан"] },
  { id: "p14", parent: "p13", names: ["Дастан"] },
  { id: "p15", parent: "p12", names: ["Эмир", "Элдияр"] },
  { id: "p16", parent: "p15", names: ["Рысбек"] },
  { id: "p17", parent: "p9", names: ["Улан", "Эламан"] },
  { id: "p18", parent: "p9", names: ["Бакыт"] },
  { id: "p19", parent: "p18", names: ["Билалы"] },
  { id: "p20", parent: "p9", names: ["Замир", "Эмил", "Назарбек", "Канат"] },
  { id: "p21", parent: "p20", names: ["Мирлан"] },
  { id: "p22", parent: "p9", names: ["Санташ", "Талант", "Талай", "Канат"] },
  { id: "p23", parent: "p22", names: ["Кайрат", "Ислам"] },
  { id: "p24", parent: "p22", names: ["Бакберген"] },

  { id: "p25", parent: "p7", names: ["Усуп", "Мырзалы", "Дүйшаалы"] },
  { id: "p26", parent: "p25", names: ["Асан"] },
  { id: "p27", parent: "p25", names: ["Азыкен"] },
  { id: "p28", parent: "p27", names: ["Кудайберген", "Курманбек", "Султан"] },
  { id: "p29", parent: "p28", names: ["Отомбай"] },
  { id: "p30", parent: "p28", names: ["Мелис"] },
  { id: "p35", parent: "p28", names: ["Азамат", "Калыгул"] },
  { id: "p36", parent: "p35", names: ["Эржигит"] },
  { id: "p31", parent: "p26", names: ["Алик", "Эрик", "Бакыт"] },
  { id: "p32", parent: "p31", names: ["Урмат", "Рамазан", "Руслан"] },
  { id: "p34", parent: "p32", names: ["Кубаныч"] },
  { id: "p33", parent: "p31", names: ["Нурбол", "Дениз"] },

  /* Сегизсары */
  { id: "g1", parent: "segizsary", names: ["Мамбетказы", "Абыл", "Мырзалы"] },
  { id: "g2", parent: "g1", names: ["Абен"] },
  { id: "g4", parent: "g2", names: ["Самар"] },
  { id: "g3", parent: "g1", names: ["Бактыбек", "Камчыбек"] },
  { id: "g5", parent: "g3", names: ["Үдүлет", "Асыл"] },
  { id: "g6", parent: "g5", names: ["Нурислам"] },
  { id: "g7", parent: "g5", names: ["Амир"] },
  { id: "g8", parent: "g7", names: ["Алтынбек"] },

  /* Күрөң */
  { id: "u1", parent: "kuron", names: ["Абышей"] },
  { id: "u2", parent: "u1", names: ["Мукамбет"] },
  { id: "u3", parent: "u2", names: ["Кубан", "Врачбек", "Саадат", "Кубанычбек"] },
  { id: "u4", parent: "u3", names: ["Тилек", "Арслан", "Арсен"] },
  { id: "u5", parent: "u4", names: ["Аким", "Мукамбетали"] }
];
