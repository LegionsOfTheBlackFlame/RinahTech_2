export default function combineAndSortData(videos, images) {
    const combined = videos.concat(images);
    combined.sort((a, b) => b.date - a.date); // Sort by date descending
    return combined;
}
