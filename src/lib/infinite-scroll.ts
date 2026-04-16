// Client-side helper — used from inline <script> tags on both builder pages.
// IntersectionObserver-based infinite scroll. Fetches a batch, renders each
// item, appends to the list. Stops when `loaded >= total`.

export interface InfiniteScrollOptions<T> {
  list: HTMLElement;
  sentinel: HTMLElement;
  spinner: HTMLElement;
  endUi: HTMLElement;
  batchSize: number;
  total: number;
  initialLoaded: number;
  fetchBatch: (offset: number, limit: number) => Promise<T[]>;
  renderItem: (item: T) => string; // HTML string appended to list
  endMessage: (total: number) => string;
}

export function attachInfiniteScroll<T>(opts: InfiniteScrollOptions<T>): () => void {
  let loaded = opts.initialLoaded;
  let loading = false;

  if (loaded >= opts.total) {
    opts.sentinel.style.display = 'none';
    opts.endUi.textContent = opts.endMessage(opts.total);
    opts.endUi.style.display = 'block';
    return () => {};
  }

  const obs = new IntersectionObserver(async (entries) => {
    if (!entries[0].isIntersecting || loading || loaded >= opts.total) return;
    loading = true;
    opts.spinner.style.display = 'block';
    try {
      const items = await opts.fetchBatch(loaded, opts.batchSize);
      items.forEach(item => {
        opts.list.insertAdjacentHTML('beforeend', opts.renderItem(item));
      });
      loaded += items.length;
      if (items.length === 0 || loaded >= opts.total) {
        obs.disconnect();
        opts.sentinel.style.display = 'none';
        opts.endUi.textContent = opts.endMessage(opts.total);
        opts.endUi.style.display = 'block';
      }
    } catch (err) {
      console.error('Infinite scroll fetch failed:', err);
      obs.disconnect();
      opts.sentinel.style.display = 'none';
      opts.endUi.textContent = 'Failed to load more results';
      opts.endUi.style.display = 'block';
    } finally {
      loading = false;
      opts.spinner.style.display = 'none';
    }
  }, { rootMargin: '200px' });

  obs.observe(opts.sentinel);
  return () => obs.disconnect();
}
