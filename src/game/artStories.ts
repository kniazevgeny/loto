type StoryLanguage = "en" | "fr" | "ru";
type StoryCopy = Record<StoryLanguage, { headline: string; fact: string }>;

type ArtSpot = {
  x: number;
  y: number;
  copy: StoryCopy;
  url?: string;
};

export type ArtStory = {
  museum: string;
  url: string;
  copy: StoryCopy;
  spots: ArtSpot[];
};

export const storyLocale = (language: string): StoryLanguage => language === "fr" || language === "ru" ? language : "en";

// These IDs refer only to the exact reproductions in the bundled library.
export const artStories = new Map<string, ArtStory>([
  ["commons-portrait-arnolfini", {
    museum: "The National Gallery",
    url: "https://www.nationalgallery.org.uk/paintings/jan-van-eyck-the-arnolfini-portrait",
    copy: {
      en: { headline: "A room full of clues", fact: "Van Eyck packed this portrait with details. Even things that look casually left around tell you something about the people in the room." },
      fr: { headline: "Une pièce pleine d’indices", fact: "Van Eyck a semé des détails partout. Même les objets posés en apparence au hasard nous en disent long sur les occupants de la pièce." },
      ru: { headline: "Комната с подсказками", fact: "Ван Эйк наполнил портрет деталями. Даже вещи, оставленные будто бы случайно, кое-что рассказывают о людях в комнате." },
    },
    spots: [
      { x: 51, y: 30, copy: {
        en: { headline: "Two more people", fact: "The round mirror shows the couple from behind, plus two figures at the doorway that you can’t see anywhere else." },
        fr: { headline: "Deux personnes de plus", fact: "Le miroir rond montre le couple de dos et, dans l’embrasure de la porte, deux personnes invisibles ailleurs dans le tableau." },
        ru: { headline: "Ещё двое", fact: "В круглом зеркале видна пара со спины и ещё две фигуры в дверном проёме. Больше нигде на картине их не видно." },
      } },
      { x: 10.5, y: 53.5, copy: {
        en: { headline: "An expensive snack", fact: "Look for the oranges by the window. They were very expensive at the time, a quiet sign of the couple’s wealth." },
        fr: { headline: "Des oranges de luxe", fact: "Repérez les oranges près de la fenêtre. Très chères à l’époque, elles signalent discrètement la richesse du couple." },
        ru: { headline: "Дорогой перекус", fact: "Найдите апельсины у окна. Тогда они стоили очень дорого и ненавязчиво говорили о достатке пары." },
      } },
    ],
  }],
  ["commons-ophlie", {
    museum: "Tate",
    url: "https://www.tate.org.uk/art/artworks/millais-ophelia-n01506/story-ophelia",
    copy: {
      en: { headline: "One painting, two locations", fact: "Millais painted a real riverbank outdoors in Surrey, then added Shakespeare’s Ophelia from a model in his studio." },
      fr: { headline: "Un tableau, deux lieux", fact: "Millais a peint une vraie berge en plein air dans le Surrey, puis a ajouté l’Ophélie de Shakespeare d’après un modèle, en atelier." },
      ru: { headline: "Одна картина, два места", fact: "Милле написал речной берег с натуры в графстве Суррей, а шекспировскую Офелию добавил уже в мастерской." },
    },
    spots: [
      { x: 64, y: 72, copy: {
        en: { headline: "A river made in the studio", fact: "To make the dress float, Elizabeth Siddal posed in a bath. Lamps beneath it warmed the water." },
        fr: { headline: "Une rivière en atelier", fact: "Pour faire flotter la robe, Elizabeth Siddal a posé dans une baignoire. Des lampes placées en dessous chauffaient l’eau." },
        ru: { headline: "Река в мастерской", fact: "Чтобы платье держалось на воде, Элизабет Сиддал позировала в ванне. Воду подогревали лампы под ванной." },
      } },
      { x: 24, y: 26, copy: {
        en: { headline: "The meaning of the willow", fact: "The willow bending over the water stands for forsaken love. Shakespeare mentions a willow in the account of Ophelia’s drowning." },
        fr: { headline: "Ce que dit le saule", fact: "Le saule penché au-dessus de l’eau symbolise l’amour délaissé. Shakespeare en mentionne un dans le récit de la noyade d’Ophélie." },
        ru: { headline: "О чём говорит ива", fact: "Ива, склонившаяся над водой, символизирует отвергнутую любовь. Шекспир упоминает иву в рассказе о гибели Офелии." },
      } },
    ],
  }],
  ["commons-l-cole-d-athnes", {
    museum: "Vatican Museums",
    url: "https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/scuola-di-atene.html",
    copy: {
      en: { headline: "Ancient thinkers, Renaissance setting", fact: "Raphael gathered ancient philosophers under grand arches inspired by plans for the rebuilding of St Peter’s Basilica." },
      fr: { headline: "Des penseurs antiques, un décor Renaissance", fact: "Raphaël a réuni des philosophes antiques sous de grandes voûtes inspirées du projet de reconstruction de la basilique Saint-Pierre." },
      ru: { headline: "Античные мыслители среди арок Возрождения", fact: "Рафаэль собрал древних философов под сводами, на которые его вдохновил проект перестройки собора Святого Петра." },
    },
    spots: [
      { x: 46.5, y: 62, copy: {
        en: { headline: "Plato points up", fact: "At the center, Plato points skyward and carries his Timaeus. Beside him, Aristotle holds his Ethics." },
        fr: { headline: "Platon montre le ciel", fact: "Au centre, Platon pointe le doigt vers le ciel et tient son Timée. À ses côtés, Aristote porte son Éthique." },
        ru: { headline: "Платон указывает вверх", fact: "В центре Платон указывает пальцем в небо и держит свой «Тимей». Рядом Аристотель с «Этикой»." },
      } },
      { x: 77.5, y: 89, copy: {
        en: { headline: "Geometry on the floor", fact: "Euclid is the teacher bending over a slate. His pupils lean in to watch him demonstrate geometry with a compass." },
        fr: { headline: "Un cours de géométrie au sol", fact: "Euclide se penche sur une ardoise. Ses élèves se rapprochent pour suivre sa démonstration de géométrie au compas." },
        ru: { headline: "Геометрия на полу", fact: "Евклид склонился над дощечкой. Ученики смотрят, как он объясняет геометрию с помощью циркуля." },
      } },
    ],
  }],
  ["commons-le-printemps", {
    museum: "Uffizi Galleries",
    url: "https://www.uffizi.it/en/artworks/botticelli-spring",
    copy: {
      en: { headline: "Spring in an orange grove", fact: "Botticelli filled an orange and laurel grove with mythological figures. The story unfolds along both edges." },
      fr: { headline: "Le printemps dans les orangers", fact: "Botticelli a peuplé un bosquet d’orangers et de lauriers de figures mythologiques. L’histoire se joue aux deux extrémités du tableau." },
      ru: { headline: "Весна в апельсиновой роще", fact: "Боттичелли населил рощу апельсиновых и лавровых деревьев мифологическими героями. Действие разворачивается по краям картины." },
    },
    spots: [
      { x: 78, y: 43, copy: {
        en: { headline: "One nymph, twice", fact: "The blue figure is Zephyrus, the spring wind. He seizes Chloris, who appears again beside her first self as Flora, dressed in flowers." },
        fr: { headline: "Une nymphe, deux fois", fact: "Le personnage bleu est Zéphyr, le vent du printemps. Il saisit Chloris, qui réapparaît juste à côté en Flore, vêtue de fleurs." },
        ru: { headline: "Одна нимфа, два образа", fact: "Синяя фигура — Зефир, весенний ветер. Он хватает Хлориду, а рядом она уже предстаёт Флорой в цветочном наряде." },
      } },
      { x: 7, y: 31, copy: {
        en: { headline: "Mercury clears the sky", fact: "At the far left, Mercury raises his staff toward a cloud. His winged sandals give away who he is." },
        fr: { headline: "Mercure dégage le ciel", fact: "Tout à gauche, Mercure lève son bâton vers un nuage. Ses sandales ailées permettent de le reconnaître." },
        ru: { headline: "Меркурий разгоняет облака", fact: "Слева Меркурий поднимает жезл к облаку. Узнать его помогают крылатые сандалии." },
      } },
    ],
  }],
  ["commons-la-jeune-fille-la-perle", {
    museum: "Mauritshuis",
    url: "https://www.mauritshuis.nl/en/our-collection/restoration-and-research/closer-to-vermeer-and-the-girl",
    copy: {
      en: { headline: "A study in illusion", fact: "This isn’t a formal portrait. It’s a tronie: a study of a face, an expression and a striking costume." },
      fr: { headline: "L’art de l’illusion", fact: "Ce n’est pas un portrait officiel, mais une « tronie » : une étude de visage, d’expression et de costume." },
      ru: { headline: "Искусство иллюзии", fact: "Это не парадный портрет, а трони — этюд лица, выражения и необычного костюма." },
    },
    spots: [
      { x: 61.5, y: 54.5, copy: {
        en: { headline: "The floating pearl", fact: "Vermeer never painted a hook. A few touches of white give the pearl its shine, and your eye does the rest." },
        fr: { headline: "La perle en suspens", fact: "Vermeer n’a pas peint de crochet. Quelques touches de blanc font briller la perle, et votre œil fait le reste." },
        ru: { headline: "Жемчужина без крючка", fact: "Вермеер не написал крючок. Несколько мазков белой краски придают жемчужине блеск, а остальное дорисовывает глаз." },
      } },
      { x: 56, y: 26, url: "https://www.mauritshuis.nl/en/our-collection/restoration-and-research/closer-to-vermeer-and-the-girl/girl-with-a-blog/blue-pigment-girl-with-a-pearl-earring-vermeer", copy: {
        en: { headline: "Blue made from stone", fact: "The blue scarf contains ultramarine, a pigment made from ground lapis lazuli." },
        fr: { headline: "Du bleu taillé dans la pierre", fact: "Le foulard contient de l’outremer, un pigment obtenu en broyant du lapis-lazuli." },
        ru: { headline: "Синий цвет из камня", fact: "В платке есть ультрамарин — пигмент из растёртого лазурита." },
      } },
    ],
  }],
  ["commons-la-laitire", {
    museum: "Rijksmuseum",
    url: "https://www.rijksmuseum.nl/en/press/press-releases/rijksmuseum-reveals-major-discoveries-on-vermeer-s-painting-the-milkmaid",
    copy: {
      en: { headline: "A kitchen with secrets", fact: "Scans show that Vermeer painted over two objects. The kitchen looked a little more crowded before he changed his mind." },
      fr: { headline: "Une cuisine pleine de secrets", fact: "Des analyses révèlent deux objets que Vermeer a recouverts. La cuisine était un peu plus encombrée avant qu’il ne change d’avis." },
      ru: { headline: "Кухня с секретами", fact: "Сканирование показало два предмета, которые Вермеер закрасил. До этого на кухне было чуть теснее." },
    },
    spots: [
      { x: 80, y: 31, copy: {
        en: { headline: "Jugs behind the wall", fact: "Scans found a rack with jugs behind the milkmaid’s head. Vermeer covered it with paint, leaving the wall bare." },
        fr: { headline: "Des cruches sous la peinture", fact: "Les analyses ont révélé un support à cruches derrière la tête de la laitière. Vermeer l’a recouvert, laissant le mur nu." },
        ru: { headline: "Кувшины под краской", fact: "За головой молочницы обнаружилась полка с кувшинами. Вермеер закрасил её, оставив стену пустой." },
      } },
      { x: 85, y: 85, copy: {
        en: { headline: "A hidden fire basket", fact: "Under the paint near the little foot warmer, scans revealed a larger object: a basket for hot coals." },
        fr: { headline: "Un panier à braises caché", fact: "Sous la peinture près du petit chauffe-pieds, les analyses ont révélé un objet plus grand : un panier à braises." },
        ru: { headline: "Спрятанная корзина с углями", fact: "Под краской рядом с маленькой грелкой для ног нашли предмет покрупнее — корзину с горячими углями." },
      } },
    ],
  }],
  ["commons-la-ronde-de-nuit", {
    museum: "Rijksmuseum",
    url: "https://www.rijksmuseum.nl/en/story/the-missing-pieces-of-the-night-watch-article",
    copy: {
      en: { headline: "Too wide for the wall", fact: "In 1715, the painting was trimmed on all four sides to fit between two doors at Amsterdam’s Town Hall. The biggest strip came off the left." },
      fr: { headline: "Trop large pour le mur", fact: "En 1715, on a découpé les quatre côtés de la toile pour la faire tenir entre deux portes de l’hôtel de ville d’Amsterdam. La plus grande bande a été retirée à gauche." },
      ru: { headline: "Не поместилась на стене", fact: "В 1715 году холст обрезали со всех четырёх сторон, чтобы он поместился между двумя дверями амстердамской ратуши. Самую широкую полосу отрезали слева." },
    },
    spots: [
      { x: 30, y: 62, url: "https://www.rijksmuseum.nl/en/stories/10-things/story/10-things-about-rembrandt-s-night-watch", copy: {
        en: { headline: "The girl in gold", fact: "She’s the militia’s mascot. The chicken claws at her waist hint at the company’s emblem." },
        fr: { headline: "La jeune fille en or", fact: "C’est la mascotte de la milice. Les griffes du poulet à sa ceinture évoquent l’emblème de la compagnie." },
        ru: { headline: "Девочка в золотом", fact: "Она — талисман отряда. Куриные когти у её пояса отсылают к эмблеме роты." },
      } },
      { x: 61, y: 68, url: "https://www.rijksmuseum.nl/en/stories/10-things/story/10-things-about-rembrandt-s-night-watch", copy: {
        en: { headline: "A shadow on the coat", fact: "The captain reaches out. Follow his hand to find its shadow across the lieutenant’s yellow coat." },
        fr: { headline: "Une ombre sur l’habit", fact: "Le capitaine tend la main. Suivez-la du regard : son ombre traverse l’habit jaune du lieutenant." },
        ru: { headline: "Тень на камзоле", fact: "Капитан протягивает руку. Её тень ложится на жёлтый камзол лейтенанта." },
      } },
    ],
  }],
  ["commons-impression-soleil-levant", {
    museum: "Musée Marmottan Monet",
    url: "https://www.marmottan.fr/en/notice/4014/",
    copy: {
      en: { headline: "A joke that stuck", fact: "In 1874, critic Louis Leroy used the title of Monet’s sunrise to poke fun at a group of painters. The name stuck: Impressionism." },
      fr: { headline: "Une moquerie qui fait école", fact: "En 1874, le critique Louis Leroy reprend le titre du lever de soleil de Monet pour se moquer d’un groupe de peintres. Le nom leur est resté : l’impressionnisme." },
      ru: { headline: "Шутка, которая прижилась", fact: "В 1874 году критик Луи Леруа обыграл название картины Моне, чтобы подшутить над группой художников. Так за ними закрепилось имя «импрессионисты»." },
    },
    spots: [
      { x: 61, y: 30, copy: {
        en: { headline: "The last bit of sun", fact: "Monet added the bright orange sun and its reflection on the water as finishing touches." },
        fr: { headline: "Le soleil en dernier", fact: "Monet a ajouté le soleil orange et son reflet sur l’eau parmi les dernières touches." },
        ru: { headline: "Солнце напоследок", fact: "Оранжевое солнце и его отражение в воде Моне добавил в самом конце." },
      } },
      { x: 26, y: 43, copy: {
        en: { headline: "A working port", fact: "Look into the mist: those faint shapes are cranes, masts and smokestacks in Le Havre’s harbor." },
        fr: { headline: "Un port en activité", fact: "Regardez dans la brume : ces formes à peine visibles sont les grues, les mâts et les cheminées du port du Havre." },
        ru: { headline: "Рабочий порт", fact: "Присмотритесь к туману: в нём проступают краны, мачты и трубы порта Гавра." },
      } },
    ],
  }],
  ["commons-la-nuit-toile", {
    museum: "Musée d’Orsay",
    url: "https://www.musee-orsay.fr/en/artworks/la-nuit-etoilee-78696",
    copy: {
      en: { headline: "Two lights, one night", fact: "Van Gogh painted the Rhône at night in Arles, setting the soft starlight against the bright gas lamps along the river." },
      fr: { headline: "Deux lumières dans la nuit", fact: "À Arles, Van Gogh a peint le Rhône de nuit, opposant la douce lumière des étoiles à l’éclat des becs de gaz sur la rive." },
      ru: { headline: "Два света одной ночи", fact: "В Арле Ван Гог написал ночную Рону, противопоставив мягкий свет звёзд ярким газовым фонарям на берегу." },
    },
    spots: [
      { x: 45, y: 63, copy: {
        en: { headline: "Gold on the river", fact: "Those gold streaks aren’t stars reflected in the water. They’re the gas lights on the far bank." },
        fr: { headline: "De l’or sur le fleuve", fact: "Ces traînées dorées ne reflètent pas les étoiles : elles viennent des becs de gaz de l’autre rive." },
        ru: { headline: "Золото на реке", fact: "В золотых полосах отражаются не звёзды, а газовые фонари на другом берегу." },
      } },
      { x: 77, y: 88, copy: {
        en: { headline: "Two people on the bank", fact: "Just below the blue sky and bright reflections, two lovers stand on the near bank." },
        fr: { headline: "Deux silhouettes sur la rive", fact: "Au premier plan, sous le ciel bleu et les reflets lumineux, deux amoureux se tiennent sur la berge." },
        ru: { headline: "Двое на берегу", fact: "На переднем плане, под синим небом и сияющими отражениями, на берегу стоят двое влюблённых." },
      } },
    ],
  }],
  ["commons-la-femme-l-ombrelle", {
    museum: "National Gallery of Art",
    url: "https://www.nga.gov/artworks/61379-woman-parasol-madame-monet-and-her-son",
    copy: {
      en: { headline: "A family walk", fact: "That’s Monet’s wife, Camille, and their son Jean. He painted them outdoors from low on the slope." },
      fr: { headline: "Une balade en famille", fact: "Voici Camille, la femme de Monet, et leur fils Jean. Il les a peints en plein air, depuis le bas de la pente." },
      ru: { headline: "Семейная прогулка", fact: "Это Камилла, жена Моне, и их сын Жан. Художник писал их на открытом воздухе, глядя снизу по склону." },
    },
    spots: [
      { x: 61, y: 20, copy: {
        en: { headline: "A veil in the wind", fact: "Look for the long white brushstrokes by Camille’s face. A few loose marks make her veil look as if it’s fluttering." },
        fr: { headline: "Un voile dans le vent", fact: "Près du visage de Camille, de longs traits blancs suffisent à faire flotter le voile." },
        ru: { headline: "Вуаль на ветру", fact: "Присмотритесь к длинным белым мазкам у лица Камиллы. Благодаря им её вуаль словно развевается." },
      } },
      { x: 27, y: 61, copy: {
        en: { headline: "Only half of Jean", fact: "The rise in the hill hides Jean below the waist. We’re seeing the family from below, not at eye level." },
        fr: { headline: "Jean à mi-hauteur", fact: "La pente cache le bas du corps de Jean. On regarde la famille d’en bas, pas à hauteur des yeux." },
        ru: { headline: "Жан виден по пояс", fact: "Склон скрывает Жана ниже пояса. Мы смотрим на семью снизу, а не с уровня глаз." },
      } },
    ],
  }],
  ["commons-le-3-mai-1808", {
    museum: "Museo Nacional del Prado",
    url: "https://www.museodelprado.es/en/the-collection/art-work/the-3rd-of-may-1808-in-madrid-or-the-executions/5e177409-2993-4240-97fb-847a02c6496c",
    copy: {
      en: { headline: "Moved to the dark", fact: "The French reprisals after Madrid’s uprising began on the afternoon of 2 May. Goya, painting six years later, set the executions on a rainy night." },
      fr: { headline: "Déplacé dans la nuit", fact: "Les représailles françaises après le soulèvement de Madrid ont commencé l’après-midi du 2 mai. Six ans plus tard, Goya place les exécutions par une nuit pluvieuse." },
      ru: { headline: "Перенесено в ночь", fact: "Французские расправы после восстания в Мадриде начались днём 2 мая. Гойя, писавший картину шесть лет спустя, перенёс казнь в дождливую ночь." },
    },
    spots: [
      { x: 27, y: 22, copy: {
        en: { headline: "Arms wide open", fact: "The man in the white shirt raises both arms. The Prado reads his pose as an echo of the Crucifixion." },
        fr: { headline: "Les bras grands ouverts", fact: "L’homme à la chemise blanche lève les deux bras. Le Prado y voit un écho de la Crucifixion." },
        ru: { headline: "Раскинутые руки", fact: "Человек в белой рубахе вскидывает обе руки. В Прадо видят в этой позе отсылку к Распятию." },
      } },
      { x: 66, y: 66, copy: {
        en: { headline: "One lantern", fact: "The only light comes from the lantern on the ground. It falls on the victims and leaves the soldiers in shadow." },
        fr: { headline: "Une seule lanterne", fact: "Toute la lumière vient de la lanterne posée au sol. Elle éclaire les victimes et laisse les soldats dans l’ombre." },
        ru: { headline: "Один фонарь", fact: "Весь свет идёт от фонаря на земле. Он выхватывает жертв и оставляет солдат в тени." },
      } },
      { x: 79, y: 22, copy: {
        en: { headline: "No faces", fact: "You never see the soldiers’ faces. Lined up in strict order, they look less like people than killing machines." },
        fr: { headline: "Sans visage", fact: "On ne voit jamais le visage des soldats. Alignés au cordeau, ils ressemblent moins à des hommes qu’à des machines à tuer." },
        ru: { headline: "Без лиц", fact: "Лиц солдат мы так и не видим. Выстроенные в строгий ряд, они похожи не на людей, а на машины для убийства." },
      } },
    ],
  }],
  ["commons-les-mnines", {
    museum: "Museo Nacional del Prado",
    url: "https://www.museodelprado.es/en/the-collection/art-work/las-meninas/9fdc7800-9ade-48b0-ab8b-edee94ea877f",
    copy: {
      en: { headline: "Who’s posing for whom?", fact: "Little Infanta Margarita stands in the middle with her maids of honour, the meninas. But the painter in the picture is working on someone else’s portrait." },
      fr: { headline: "Qui pose pour qui ?", fact: "La petite infante Marguerite se tient au centre, entourée de ses demoiselles d’honneur, les ménines. Mais le peintre du tableau fait le portrait de quelqu’un d’autre." },
      ru: { headline: "Кто кому позирует?", fact: "В центре стоит маленькая инфанта Маргарита со своими фрейлинами — менинами. Но художник на картине пишет чужой портрет." },
    },
    spots: [
      { x: 31, y: 17, copy: {
        en: { headline: "The real sitters", fact: "The mirror at the back reflects King Philip IV and Queen Mariana. They stand where you are standing now." },
        fr: { headline: "Les vrais modèles", fact: "Le miroir du fond reflète le roi Philippe IV et la reine Marie-Anne. Ils se tiennent là où vous êtes." },
        ru: { headline: "Настоящие модели", fact: "В зеркале на задней стене отражаются король Филипп IV и королева Марианна. Они стоят там, где сейчас стоите вы." },
      } },
      { x: 9, y: 19, copy: {
        en: { headline: "The painter, at work", fact: "Velázquez painted himself with brush and palette, behind a huge canvas whose front we never get to see." },
        fr: { headline: "Le peintre au travail", fact: "Velázquez s’est représenté pinceau et palette en main, derrière une immense toile dont on ne verra jamais la face." },
        ru: { headline: "Художник за работой", fact: "Веласкес изобразил себя с кистью и палитрой за огромным холстом, лицевую сторону которого мы так и не увидим." },
      } },
    ],
  }],
  ["commons-le-radeau-de-la-mduse", {
    museum: "Musée du Louvre",
    url: "https://collections.louvre.fr/en/ark:/53355/cl010059199",
    copy: {
      en: { headline: "Ripped from the news", fact: "In 1816 the frigate Méduse ran aground off Senegal, and about 150 people were put on a makeshift raft. After 12 days adrift, only 15 were still alive." },
      fr: { headline: "Un fait divers", fact: "En 1816, la frégate la Méduse s’échoue au large du Sénégal et environ 150 personnes embarquent sur un radeau de fortune. Après douze jours de dérive, quinze seulement sont encore en vie." },
      ru: { headline: "Из газетной хроники", fact: "В 1816 году фрегат «Медуза» сел на мель у берегов Сенегала, и около 150 человек оказались на самодельном плоту. Через 12 дней дрейфа в живых осталось только 15." },
    },
    spots: [
      { x: 70, y: 16, copy: {
        en: { headline: "A speck of hope", fact: "The men at the top wave cloths at a tiny ship on the horizon: the Argus, the brig that finally spotted the raft." },
        fr: { headline: "Un point d’espoir", fact: "Au sommet, des hommes agitent des linges vers un minuscule navire à l’horizon : l’Argus, le brick qui a fini par repérer le radeau." },
        ru: { headline: "Крупица надежды", fact: "Люди наверху машут тканью крошечному кораблю на горизонте. Это бриг «Аргус», который в итоге заметил плот." },
      } },
      { x: 46, y: 84, copy: {
        en: { headline: "Built to scale", fact: "Géricault had a model of the raft made, arranged wax figures on it, and met survivors, two of whom posed for him." },
        fr: { headline: "Construit en maquette", fact: "Géricault a fait fabriquer une maquette du radeau, y a disposé des figurines de cire et a rencontré des survivants, dont deux ont posé pour lui." },
        ru: { headline: "Плот в миниатюре", fact: "Жерико заказал модель плота, расставил на ней восковые фигурки и встречался с выжившими. Двое из них ему позировали." },
      } },
    ],
  }],
  ["commons-la-charrette-de-foin", {
    museum: "The National Gallery",
    url: "https://www.nationalgallery.org.uk/paintings/john-constable-the-hay-wain",
    copy: {
      en: { headline: "The flat ford", fact: "The empty hay cart is crossing a shallow spot in the River Stour at Flatford, the ‘flat ford’ that gave the place its name." },
      fr: { headline: "Le gué plat", fact: "La charrette vide traverse un passage peu profond de la Stour, à Flatford : le « gué plat » qui a donné son nom au lieu." },
      ru: { headline: "Мелкий брод", fact: "Пустая телега переходит мелководье реки Стур во Флатфорде. Этот «плоский брод» и дал месту название." },
    },
    spots: [
      { x: 12, y: 50, copy: {
        en: { headline: "Still standing", fact: "The house on the left belonged to tenant farmer Willy Lott. Often called a cottage, it was really a sizeable farm, and it’s still there today." },
        fr: { headline: "Toujours debout", fact: "La maison de gauche était celle du fermier Willy Lott. Souvent appelée « cottage », c’était en fait une belle ferme, toujours debout aujourd’hui." },
        ru: { headline: "Стоит до сих пор", fact: "Дом слева принадлежал фермеру-арендатору Вилли Лотту. Его называют коттеджем, но это была крупная ферма, и она сохранилась до наших дней." },
      } },
      { x: 36, y: 88, copy: {
        en: { headline: "A vanished rider", fact: "X-rays show a horse and rider once stood just right of the dog. Constable painted them out." },
        fr: { headline: "Un cavalier disparu", fact: "Les radiographies montrent qu’un cheval et son cavalier se tenaient juste à droite du chien. Constable les a effacés." },
        ru: { headline: "Исчезнувший всадник", fact: "Рентген показывает, что справа от собаки когда-то стояли лошадь со всадником. Констебл их закрасил." },
      } },
    ],
  }],
]);