export function getMinimumViewHeightToPreserveScroll({
  documentHeight,
  naturalViewHeight,
  renderedViewHeight,
  scrollY,
  viewportHeight,
}: {
  documentHeight: number;
  naturalViewHeight: number;
  renderedViewHeight: number;
  scrollY: number;
  viewportHeight: number;
}) {
  const heightOutsideView = Math.max(0, documentHeight - renderedViewHeight);
  const heightRequiredForScroll = scrollY + viewportHeight - heightOutsideView;

  return Math.max(0, naturalViewHeight, heightRequiredForScroll);
}
