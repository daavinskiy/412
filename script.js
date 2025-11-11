// script.js (полный, обновлённый)

// index.html
const aloitaBtn = document.getElementById("aloita-btn");
if (aloitaBtn) {
    aloitaBtn.addEventListener("click", () => {
        window.location.href = "asetukset.html";
    });
}

// asetukset.html элементы
const aloitaPeliBtn = document.getElementById("aloita-peli");
const vastustajaRadios = document.getElementsByName("vastustaja");
const noppaRadios = document.getElementsByName("noppa");
const pelaajienMaara = document.getElementById("pelaajien-maara");
const pelaajienMaaraLabel = document.getElementById("pelaajien-maara-label");
const pelaajienMaaraNaytto = document.getElementById("pelaajien-maara-naytto");

if (vastustajaRadios) {
    vastustajaRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "botti" && radio.checked) {
                pelaajienMaara.disabled = true;
                pelaajienMaara.value = 2;
                pelaajienMaaraNaytto.textContent = "2";
                pelaajienMaaraLabel.style.textDecoration = "line-through";
            } else if (radio.value === "ihmiset" && radio.checked) {
                pelaajienMaara.disabled = false;
                pelaajienMaaraLabel.style.textDecoration = "none";
            }
        });
    });
}

if (pelaajienMaara) {
    pelaajienMaara.addEventListener("input", () => {
        if (pelaajienMaara.value < 2) pelaajienMaara.value = 2;
        if (pelaajienMaara.value > 6) pelaajienMaara.value = 6;
        pelaajienMaaraNaytto.textContent = pelaajienMaara.value;
    });
}

if (aloitaPeliBtn) {
    aloitaPeliBtn.addEventListener("click", () => {
        const vastustajaValinta = Array.from(vastustajaRadios).find(r => r.checked);
        const noppaValinta = Array.from(noppaRadios).find(r => r.checked);
        if (!vastustajaValinta || !noppaValinta) {
            alert("Valitse vastustaja ja nopan määrä.");
            return;
        }
        const nopanMaara = noppaValinta.value;
        const pelaajienLkm = vastustajaValinta.value === "botti" ? 1 : pelaajienMaara.value;
        localStorage.setItem("vastustaja", vastustajaValinta.value);
        localStorage.setItem("nopanMaara", nopanMaara);
        localStorage.setItem("pelaajienLkm", pelaajienLkm);
        window.location.href = "peli.html";
    });
}

// peli.html элементы
const nopatContainer = document.getElementById("nopat");
const heittoBtn = document.getElementById("heitto-btn");
const lopetaBtn = document.getElementById("lopeta-btn");
const muutaBtn = document.getElementById("muuta-asetuksia-btn");
const vuorossa = document.getElementById("vuorossa");
const vuoroPisteet = document.getElementById("vuoro-pisteet");
const pelaajaListaDiv = document.getElementById("pelaaja-pisteet-lista");

let nopanMaara = parseInt(localStorage.getItem("nopanMaara")) || 1;
let pelaajienLkm = parseInt(localStorage.getItem("pelaajienLkm")) || 2;
let vastustaja = localStorage.getItem("vastustaja") || "ihmiset";

let pelaajat = [];
let pisteet = [];
let vuoro = 0;
let vuoroPiste = 0;

// новая булева: был ли на последнем броске эффект "одна единица" (у игрока)
let viimeinenHeittoSisaltoYksi = false;

function alustaPelaajat() {
    pelaajat = [];
    pisteet = [];
    for (let i = 0; i < pelaajienLkm; i++) {
        let nimi = prompt(`Anna pelaajan ${i + 1} nimi:`);
        if (!nimi) nimi = `Pelaaja ${i + 1}`;
        pelaajat.push(nimi);
        pisteet.push(0);
    }
    if (vastustaja === "botti") {
        pelaajat.push("Botti Daniel A.");
        pisteet.push(0);
    }
}

function luoNopat() {
    nopatContainer.innerHTML = "";
    for (let i = 0; i < nopanMaara; i++) {
        const noppa = document.createElement("div");
        noppa.classList.add("noppa");
        noppa.textContent = "0";
        nopatContainer.appendChild(noppa);
    }
}

function paivitaNaytto() {
    vuorossa.textContent = `Vuoro: ${pelaajat[vuoro]}`;
    vuoroPisteet.textContent = `Vuoro pisteet: ${vuoroPiste}`;
    // список игроков и подсветка текущего
    pelaajaListaDiv.innerHTML = "";
    for (let i = 0; i < pelaajat.length; i++) {
        const p = document.createElement("p");
        p.textContent = `${pelaajat[i]}: ${pisteet[i]} pistettä`;
        if (i === vuoro) {
            p.classList.add("vuoro");
        }
        pelaajaListaDiv.appendChild(p);
    }
    // обновление состояния кнопок централизовано
    paivitaNapit();
}

function paivitaNapit() {
    // Muuta asetuksia всегда доступна
    if (muutaBtn) muutaBtn.disabled = false;

    const onBottiVuoro = (vastustaja === "botti" && pelaajat[vuoro] === "Botti Daniel A.");
    if (onBottiVuoro) {
        // во время хода бота игрок не может кликать heitto/lopeta
        if (heittoBtn) heittoBtn.disabled = true;
        if (lopetaBtn) lopetaBtn.disabled = true;
    } else {
        // ход реального игрока
        // Lopeta vuoro всегда доступна игроку (чтобы он мог закончить ход)
        if (lopetaBtn) lopetaBtn.disabled = false;

        // Heitä noppa блокируется, если на последнем броске у игрока выпала единица
        // (viimeinenHeittoSisaltoYksi хранит именно этот флаг)
        if (heittoBtn) heittoBtn.disabled = viimeinenHeittoSisaltoYksi;
    }
}

function heitaNopat() {
    viimeinenHeittoSisaltoYksi = false; // сброс перед броском
    const tulokset = [];
    let yksitellen = false;

    for (let i = 0; i < nopanMaara; i++) {
        const arvo = Math.floor(Math.random() * 6) + 1;
        tulokset.push(arvo);
        const noppaEl = nopatContainer.children[i];
        noppaEl.textContent = arvo;

        // анимация: сброс/повтор добавления класса 'heita' для перезапуска
        noppaEl.classList.remove("heita");
        void noppaEl.offsetWidth;
        noppaEl.classList.add("heita");

        if (arvo === 1) yksitellen = true;
    }

    if (nopanMaara === 2) {
        // две единицы -> 25 очков
        if (tulokset[0] === 1 && tulokset[1] === 1) {
            vuoroPiste += 25;
            viimeinenHeittoSisaltoYksi = false;
        } else if (tulokset.includes(1) && !(tulokset[0] === 1 && tulokset[1] === 1)) {
            // ровно одна единица -> сброс очков и блокировать Heitä
            vuoroPiste = 0;
            viimeinenHeittoSisaltoYksi = true;
        } else if (tulokset[0] === tulokset[1]) {
            // дубль (не единицы) -> удвоенные очки (по условию: *4 от одного кубика; сохраним предыдущую логику)
            vuoroPiste += tulokset[0] * 4;
            viimeinenHeittoSisaltoYksi = false;
        } else {
            vuoroPiste += tulokset[0] + tulokset[1];
            viimeinenHeittoSisaltoYksi = false;
        }
    } else {
        if (yksitellen) {
            vuoroPiste = 0;
            viimeinenHeittoSisaltoYksi = true;
        } else {
            vuoroPiste += tulokset[0];
            viimeinenHeittoSisaltoYksi = false;
        }
    }

    paivitaNaytto();
}

function lopetaVuoro() {
    // добавить очки и сброс флагов
    pisteet[vuoro] += vuoroPiste;
    vuoroPiste = 0;
    viimeinenHeittoSisaltoYksi = false;

    // проверка победы
    if (pisteet[vuoro] >= 100) {
        alert(`${pelaajat[vuoro]} voitti pelin!`);
        window.location.href = "asetukset.html";
        return;
    }

    // смена хода
    vuoro = (vuoro + 1) % pelaajat.length;
    paivitaNaytto();

    // если следующий — бот, запускаем его ход
    const onBottiVuoro = (vastustaja === "botti" && pelaajat[vuoro] === "Botti Daniel A.");
    if (onBottiVuoro) {
        // блокируем кнопки игрока (muuta остаётся доступна)
        if (heittoBtn) heittoBtn.disabled = true;
        if (lopetaBtn) lopetaBtn.disabled = true;
        setTimeout(botVuoro, 800);
    }
}

function botVuoro() {
    let botPisteet = 0;
    const tavoite = 5 + Math.floor(Math.random() * 8); // 5..12
    function botHeitto() {
        // если очередь сменилась (человек вмешался) — прервать
        if (pelaajat[vuoro] !== "Botti Daniel A.") return;

        // симулируем задержку "мышления"
        // делаем бросок (с анимацией)
        for (let i = 0; i < nopanMaara; i++) {
            const arvo = Math.floor(Math.random() * 6) + 1;
            const noppaEl = nopatContainer.children[i];
            noppaEl.textContent = arvo;
            noppaEl.classList.remove("heita");
            void noppaEl.offsetWidth;
            noppaEl.classList.add("heita");
        }

        // оценка результата после небольшой паузы (чтобы анимация успела)
        setTimeout(() => {
            const tulokset = [];
            for (let i = 0; i < nopanMaara; i++) {
                tulokset.push(parseInt(nopatContainer.children[i].textContent, 10));
            }

            if (nopanMaara === 2) {
                if (tulokset[0] === 1 && tulokset[1] === 1) {
                    botPisteet += 25;
                } else if (tulokset.includes(1) && !(tulokset[0] === 1 && tulokset[1] === 1)) {
                    // одна единица — бот теряет очки и завершает ход
                    botPisteet = 0;
                    vuoroPiste = 0;
                    paivitaNaytto();
                    // завершить ход бота
                    lopetaVuoro();
                    return;
                } else if (tulokset[0] === tulokset[1]) {
                    botPisteet += tulokset[0] * 4;
                } else {
                    botPisteet += tulokset[0] + tulokset[1];
                }
            } else {
                if (tulokset[0] === 1) {
                    botPisteet = 0;
                    vuoroPiste = 0;
                    paivitaNaytto();
                    lopetaVuoro();
                    return;
                } else {
                    botPisteet += tulokset[0];
                }
            }

            vuoroPiste = botPisteet;
            paivitaNaytto();

            // решаем: продолжать ли
            if (botPisteet >= tavoite) {
                // бот завершает ход
                lopetaVuoro();
                return;
            } else {
                // небольшой интервал перед следующим броском
                setTimeout(botHeitto, 700);
            }
        }, 500);
    }
    botHeitto();
}

// навешиваем обработчики
if (heittoBtn) heittoBtn.addEventListener("click", heitaNopat);
if (lopetaBtn) lopetaBtn.addEventListener("click", lopetaVuoro);
if (muutaBtn) muutaBtn.addEventListener("click", () => {
    if (confirm("Tämän pelin tiedot menetetään. Haluatko silti muuttaa asetuksia?")) {
        window.location.href = "asetukset.html";
    }
});

// инициализация
luoNopat();
alustaPelaajat();
paivitaNaytto();
