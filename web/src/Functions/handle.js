function findMounth(mounth) {
    const mounts = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    return mounts[Number(mounth)];
}

export function dateFormat(timestamp) {
    const datetime = new Date(timestamp);
    const month = datetime.getMonth();
    const date = datetime.getDate();
    const year = datetime.getFullYear();
    const hours = datetime.getHours();
    let minutes = datetime.getMinutes();
    if (minutes < 10) {
        minutes = `0${minutes}`;
    }
    return `${hours}:${minutes} ${date} ${findMounth(month)} ${year}`;
}
