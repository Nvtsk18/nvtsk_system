/* Public training locations. Coordinates represent examples within each area. */
globalThis.NVTrainingMaps = (() => {
  "use strict";
  const regions = [
    {
      route: "map-osnabrueck", name: "Оснабрюк", work: "Электромонтаж",
      returnLabel: "На карту Оснабрюка", city: "Osnabrück",
      image: "art/osnabrueck-city.webp", alt: "Улицы и районы Оснабрюка",
      bounds: {west: 7.991, south: 52.246, east: 8.108, north: 52.303},
      sites: [
        {id: "os-lab-flats", title: "Дом на 12 квартир", label: "12 квартир", place: "Westerberg", lon: 8.019, lat: 52.283,
          scope: "Два подъезда, по шесть квартир. Электромонтаж квартир, лестничных площадок и подвала."},
        {id: "os-lab-apartment", title: "Трёхкомнатная квартира", label: "3 комнаты", place: "Innenstadt", lon: 8.050, lat: 52.273,
          scope: "Разводка освещения, розеточных групп и отдельных линий для кухни."},
        {id: "os-lab-house", title: "Частный дом · 160 м²", label: "Дом 160 м²", place: "Schölerberg", lon: 8.066, lat: 52.255,
          scope: "Электромонтаж жилого дома, распределительный щит и подготовка линий для автоматики."},
        {id: "os-lab-office", title: "Бюро · 250 м²", label: "Бюро 250 м²", place: "Fledder", lon: 8.086, lat: 52.268,
          scope: "Освещение бюро, питание рабочих мест и кабельные трассы в коммерческом помещении."}
      ]
    },
    {
      route: "map-bodensee", name: "Бодензее", work: "Солнечные панели",
      returnLabel: "На карту Бодензее", image: "art/bodensee-pv.webp", alt: "Западная часть озера Бодензее и окрестные города",
      bounds: {west: 8.755, south: 47.627, east: 9.252, north: 47.893},
      sites: [
        {id: "pv-lab-singen", title: "Жилой дом · 18 модулей", place: "Singen", lon: 8.841, lat: 47.760,
          modules: 18, roof: "Скатная черепичная крыша", scope: "Монтаж панелей на скатной крыше жилого дома. В объём работ входят крепления, модули и фотоотчёт."},
        {id: "pv-lab-stockach", title: "Мастерская · 32 модуля", place: "Stockach", lon: 9.012, lat: 47.851,
          modules: 32, roof: "Плоская крыша", scope: "Монтаж солнечных панелей на плоской крыше мастерской. Бригада сдаёт раскладку и фотографии готовых рядов."},
        {id: "pv-lab-radolfzell", title: "Гараж · 12 модулей", place: "Radolfzell", lon: 8.969, lat: 47.737,
          modules: 12, roof: "Односкатная крыша гаража", scope: "Монтаж панелей на гараже. В карточке объекта можно вести перечень материалов и приложить фотографии."},
        {id: "pv-lab-ueberlingen", title: "Цех · 48 модулей", place: "Überlingen", lon: 9.171, lat: 47.769,
          modules: 48, roof: "Профилированная металлическая кровля", scope: "Монтаж массива панелей на крыше цеха. Работы включают подготовку креплений и приёмку модулей по рядам."}
      ]
    }
  ];

  function forSite(id) {
    return regions.find(region => region.sites.some(site => site.id === id));
  }
  function forRoute(route) {
    return regions.find(region => region.route === route);
  }
  function position(region, site) {
    const {west, south, east, north} = region.bounds;
    const mercator = lat => Math.asinh(Math.tan(lat * Math.PI / 180));
    return {
      x: 100 * (site.lon - west) / (east - west),
      y: 100 * (mercator(north) - mercator(site.lat)) / (mercator(north) - mercator(south))
    };
  }
  function addCases(data) {
    if (data.labSeed !== "alpha-v1") throw Error("Учебные объекты доступны только в ALPHA LAB.");
    let next = data;
    for (const region of regions) {
      for (const site of region.sites) {
        if (next.cases.some(item => item.id === site.id)) continue;
        const area = region.city ? region.city + " · " + site.place : site.place;
        next = NVModel.apply({...next, actor: "lead"}, "case", {
          id: site.id, title: site.title, city: region.city || site.place, price: 0,
          address: area + " (учебная точка)", notes: "ALPHA LAB · " + region.work + ". " + site.scope
        });
        if (site.modules) {
          next = NVModel.apply(next, "pv-tech", {
            caseId: site.id, declaredModules: site.modules, roofType: site.roof,
            dcScope: site.scope, sourcePlan: "Учебный пример ALPHA LAB"
          });
        }
      }
    }
    return next === data ? data : {...next, actor: data.actor};
  }
  return {regions, forSite, forRoute, position, addCases};
})();
