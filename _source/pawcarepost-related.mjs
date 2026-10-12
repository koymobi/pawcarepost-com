export default function relatedArticles(article, all) {
  const peers = all.filter(item => item.category === article.category && item.slug !== article.slug);
  const older = peers.filter(item => !item.added);
  const newer = peers.filter(item => item.added);
  const categoryPosition = all.filter(item => item.category === article.category && !item.added).findIndex(item => item.slug === article.slug);
  const newPick = newer.length ? newer[(categoryPosition < 0 ? 0 : categoryPosition) % newer.length] : null;
  return [...older.slice(0, 2), ...(newPick ? [newPick] : [])].slice(0, 3);
}
