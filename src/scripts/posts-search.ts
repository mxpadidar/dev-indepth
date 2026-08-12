type SearchRecord = {
  element: HTMLLIElement;
  index: number;
  title: string;
  description: string;
  tags: string;
};

const normalize = (value: string) =>
  value.toLowerCase().replaceAll(/[-_]/g, " ").replaceAll(/\s+/g, " ").trim();

export function initPostSearch(dialog: HTMLDialogElement) {
  const input = dialog.querySelector<HTMLInputElement>("[data-search-input]");
  const list = dialog.querySelector<HTMLUListElement>("[data-search-results]");
  const count = dialog.querySelector<HTMLElement>("[data-search-count]");
  const empty = dialog.querySelector<HTMLElement>("[data-search-empty]");
  if (!input || !list || !count || !empty) return;

  const records: SearchRecord[] = [
    ...dialog.querySelectorAll<HTMLLIElement>("[data-search-item]"),
  ].map((element, index) => ({
    element,
    index,
    title: normalize(element.dataset.title ?? ""),
    description: normalize(element.dataset.description ?? ""),
    tags: normalize(element.dataset.tags ?? ""),
  }));

  const search = () => {
    const terms = normalize(input.value).split(" ").filter(Boolean);
    const matches = records
      .filter(({ title, description, tags }) =>
        terms.every((term) => `${title} ${description} ${tags}`.includes(term)),
      )
      .sort((a, b) => rank(b, terms) - rank(a, terms) || a.index - b.index);

    const visible = new Set(matches.map(({ element }) => element));
    records.forEach(({ element }) => (element.hidden = !visible.has(element)));
    list.append(...matches.map(({ element }) => element));
    count.textContent = `${matches.length} ${matches.length === 1 ? "post" : "posts"}`;
    empty.hidden = matches.length > 0;
  };

  const openSearch = () => {
    if (!dialog.open) dialog.showModal();
    input.value = "";
    search();
    input.focus();
  };

  document
    .querySelectorAll("[data-search-trigger]")
    .forEach((button) => button.addEventListener("click", openSearch));
  dialog.querySelector("[data-search-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => event.target === dialog && dialog.close());
  input.addEventListener("input", search);

  dialog.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const controls = [input, ...dialog.querySelectorAll<HTMLAnchorElement>("li:not([hidden]) a")];
    const current = controls.indexOf(document.activeElement as HTMLInputElement);
    const next = current + (event.key === "ArrowDown" ? 1 : -1);
    event.preventDefault();
    controls[Math.max(0, Math.min(controls.length - 1, next))]?.focus();
  });

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
  });
}

function rank(record: SearchRecord, terms: string[]) {
  return terms.reduce(
    (score, term) => score + (record.title.includes(term) ? 3 : record.tags.includes(term) ? 2 : 1),
    0,
  );
}
