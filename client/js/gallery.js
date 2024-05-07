document.addEventListener('DOMContentLoaded', function () {
    const btnFilter = document.getElementById('btnFilter');
    const contFilterOptions = document.getElementById('contFilterOptions');
    var isHidden = true;
    btnFilter.addEventListener('click', function () {
        if (isHidden === true) {
            isHidden = false;
            contFilterOptions.classList.remove('hidden');
        } else {
            isHidden = true;
            contFilterOptions.classList.add('hidden');
        }
    })
})