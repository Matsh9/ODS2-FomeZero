(() => {
    const STORAGE_KEY = "ecoharvest-strategic-sim-v1";
    const TURN_LIMIT = 60;
    const HISTORY_LIMIT = 24;

    const TECH_DEFINITIONS = [
        { id: "drip_irrigation", name: "Irrigação por Gotejamento", cost: 60, description: "Reduz o consumo de água em 40%.", effectLabel: "Água -40%" },
        { id: "resilient_seeds", name: "Sementes Resilientes", cost: 80, description: "Mitiga perdas por pragas comuns.", effectLabel: "Menos pragas" },
        { id: "community_composting", name: "Compostagem Comunitária", cost: 70, description: "Acelera a regeneração do solo.", effectLabel: "Solo regenera mais" },
        { id: "logistics_coop", name: "Cooperativa Logística", cost: 55, description: "Melhora distribuição e reduz desigualdade.", effectLabel: "Gini menor" }
    ];

    const CLIMATE_EVENTS = [
        {
            id: "drought",
            weight: 1,
            label: "⚠️ Seca severa",
            description: "Aquíferos caíram e a produção perdeu eficiência.",
            apply(result, flags) {
                result.aquiferLevel -= 12;
                result.soilHealth -= 4;
                result.foodMultiplier *= flags.dripIrrigation ? 0.9 : 0.82;
                result.climateRisk += 5;
            }
        },
        {
            id: "pests",
            weight: 1,
            label: "🐛 Surto de pragas",
            description: "Pragas afetaram o rendimento agrícola.",
            apply(result, flags) {
                result.foodMultiplier *= flags.resilientSeeds ? 0.95 : 0.78;
                result.soilHealth -= 7;
                result.environmentalDebt += 3;
            }
        },
        {
            id: "flood",
            weight: 1,
            label: "🌊 Inundação localizada",
            description: "Chuvas intensas causaram erosão.",
            apply(result) {
                result.soilHealth -= 10;
                result.aquiferLevel -= 4;
                result.environmentalDebt += 5;
                result.foodMultiplier *= 0.9;
            }
        },
        {
            id: "heat",
            weight: 1,
            label: "🔥 Onda de calor",
            description: "Evaporação aumentada e pressão hídrica ampliada.",
            apply(result) {
                result.aquiferLevel -= 8;
                result.foodMultiplier *= 0.89;
                result.populationShock -= 0.8;
            }
        }
    ];

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const round = (value, decimals = 0) => Math.round(value * 10 ** decimals) / 10 ** decimals;
    const formatInteger = value => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(Math.round(value));
    const formatPercent = (value, decimals = 0) => `${round(value, decimals).toFixed(decimals)}%`;
    const formatDecimal = (value, decimals = 2) => round(value, decimals).toFixed(decimals).replace(".", ",");

    function createSeededRng(seed) {
        let value = seed % 2147483647;
        if (value <= 0) {
            value += 2147483646;
        }

        return () => {
            value = value * 16807 % 2147483647;
            return (value - 1) / 2147483646;
        };
    }

    function weightedChoice(items, rng) {
        const total = items.reduce((sum, item) => sum + item.weight, 0);
        let cursor = rng() * total;

        for (const item of items) {
            cursor -= item.weight;
            if (cursor <= 0) {
                return item;
            }
        }

        return items[items.length - 1];
    }

    function normalizeMatrix(matrix) {
        const keys = ["monoculture", "family", "reserve"];
        const sanitized = keys.reduce((accumulator, key) => {
            accumulator[key] = clamp(Number(matrix[key] ?? 0), 0, 100);
            return accumulator;
        }, {});

        const total = keys.reduce((sum, key) => sum + sanitized[key], 0);
        if (total === 0) {
            return { monoculture: 34, family: 33, reserve: 33 };
        }

        const scaled = keys.reduce((accumulator, key) => {
            accumulator[key] = Math.floor(sanitized[key] / total * 100);
            return accumulator;
        }, {});

        let diff = 100 - (scaled.monoculture + scaled.family + scaled.reserve);
        const order = [...keys].sort((first, second) => sanitized[second] - sanitized[first]);
        let index = 0;

        while (diff !== 0) {
            const key = order[index % order.length];
            if (diff > 0) {
                scaled[key] += 1;
                diff -= 1;
            } else if (scaled[key] > 0) {
                scaled[key] -= 1;
                diff += 1;
            }
            index += 1;
        }

        return scaled;
    }

    // Decomposição e abstração: centraliza publicações de eventos para manter o UI desacoplado do motor.
    class EventBus {
        constructor() {
            this.listeners = new Map();
        }

        subscribe(eventName, handler) {
            if (!this.listeners.has(eventName)) {
                this.listeners.set(eventName, new Set());
            }

            this.listeners.get(eventName).add(handler);
            return () => this.unsubscribe(eventName, handler);
        }

        unsubscribe(eventName, handler) {
            const listeners = this.listeners.get(eventName);
            if (listeners) {
                listeners.delete(handler);
            }
        }

        publish(eventName, payload = {}) {
            const listeners = this.listeners.get(eventName);
            if (!listeners) {
                return;
            }

            listeners.forEach(handler => handler(payload));
        }
    }

    // Abstração do domínio: guarda o estado global e o histórico, sem conter regras de cálculo.
    class GameState {
        constructor(eventBus = null) {
            this.eventBus = eventBus;
            this.turn = 1;
            this.population = 180;
            this.foodStock = 160;
            this.capital = 140;
            this.soilHealth = 72;
            this.aquiferLevel = 78;
            this.environmentalDebt = 14;
            this.climateRisk = 18;
            this.gini = 0.31;
            this.hunger = 12;
            this.carryingCapacity = 120;
            this.agriculturalMatrix = { monoculture: 35, family: 45, reserve: 20 };
            this.policies = { distributionQuota: 60, agriculturalSubsidy: 40 };
            this.unlockedTechnologies = new Set();
            this.history = [this.createHistoryEntry("Estado inicial")];
            this.logEntries = [{ turn: 1, title: "Estado inicial", description: "A comunidade inicia com equilíbrio frágil entre produção, recursos e distribuição." }];
            this.lastTurnSummary = this.createTurnSummary();
        }

        createHistoryEntry(label) {
            return {
                turn: this.turn,
                label,
                population: this.population,
                hunger: this.hunger,
                soilHealth: this.soilHealth,
                aquiferLevel: this.aquiferLevel,
                gini: this.gini,
                capital: this.capital
            };
        }

        createTurnSummary() {
            return {
                turn: this.turn,
                population: this.population,
                foodStock: this.foodStock,
                capital: this.capital,
                soilHealth: this.soilHealth,
                aquiferLevel: this.aquiferLevel,
                climateRisk: this.climateRisk,
                gini: this.gini,
                hunger: this.hunger
            };
        }

        snapshot() {
            return {
                turn: this.turn,
                population: this.population,
                foodStock: this.foodStock,
                capital: this.capital,
                soilHealth: this.soilHealth,
                aquiferLevel: this.aquiferLevel,
                environmentalDebt: this.environmentalDebt,
                climateRisk: this.climateRisk,
                gini: this.gini,
                hunger: this.hunger,
                carryingCapacity: this.carryingCapacity,
                agriculturalMatrix: { ...this.agriculturalMatrix },
                policies: { ...this.policies },
                unlockedTechnologies: [...this.unlockedTechnologies],
                history: this.history.map(entry => ({ ...entry })),
                logEntries: this.logEntries.map(entry => ({ ...entry })),
                lastTurnSummary: { ...this.lastTurnSummary }
            };
        }

        static fromSnapshot(snapshot, eventBus = null) {
            const state = new GameState(eventBus);
            state.turn = snapshot.turn ?? 1;
            state.population = snapshot.population ?? state.population;
            state.foodStock = snapshot.foodStock ?? state.foodStock;
            state.capital = snapshot.capital ?? state.capital;
            state.soilHealth = snapshot.soilHealth ?? state.soilHealth;
            state.aquiferLevel = snapshot.aquiferLevel ?? state.aquiferLevel;
            state.environmentalDebt = snapshot.environmentalDebt ?? state.environmentalDebt;
            state.climateRisk = snapshot.climateRisk ?? state.climateRisk;
            state.gini = snapshot.gini ?? state.gini;
            state.hunger = snapshot.hunger ?? state.hunger;
            state.carryingCapacity = snapshot.carryingCapacity ?? state.carryingCapacity;
            state.agriculturalMatrix = normalizeMatrix(snapshot.agriculturalMatrix ?? state.agriculturalMatrix);
            state.policies = {
                distributionQuota: clamp(snapshot.policies?.distributionQuota ?? state.policies.distributionQuota, 0, 100),
                agriculturalSubsidy: clamp(snapshot.policies?.agriculturalSubsidy ?? state.policies.agriculturalSubsidy, 0, 100)
            };
            state.unlockedTechnologies = new Set(snapshot.unlockedTechnologies ?? []);
            state.history = Array.isArray(snapshot.history) && snapshot.history.length > 0
                ? snapshot.history.map(entry => ({ ...entry }))
                : [state.createHistoryEntry("Estado restaurado")];
            state.logEntries = Array.isArray(snapshot.logEntries) && snapshot.logEntries.length > 0
                ? snapshot.logEntries.map(entry => ({ ...entry }))
                : [{ turn: state.turn, title: "Estado restaurado", description: "Jogo carregado do armazenamento local." }];
            state.lastTurnSummary = snapshot.lastTurnSummary ? { ...snapshot.lastTurnSummary } : state.createTurnSummary();
            return state;
        }

        notify(eventName = "state:changed", payload = {}) {
            if (!this.eventBus) {
                return;
            }

            this.eventBus.publish(eventName, { state: this.snapshot(), ...payload });
        }

        setAgriculturalAllocation(key, value) {
            const current = { ...this.agriculturalMatrix };
            const fixedValue = clamp(Math.round(Number(value)), 0, 100);
            const otherKeys = ["monoculture", "family", "reserve"].filter(item => item !== key);
            const remaining = 100 - fixedValue;
            const otherTotal = otherKeys.reduce((sum, item) => sum + current[item], 0);

            current[key] = fixedValue;

            if (otherTotal === 0) {
                const share = Math.floor(remaining / otherKeys.length);
                otherKeys.forEach(item => {
                    current[item] = share;
                });
            } else {
                otherKeys.forEach(item => {
                    current[item] = Math.floor(current[item] / otherTotal * remaining);
                });
            }

            this.agriculturalMatrix = normalizeMatrix(current);
            this.notify();
        }

        setPolicy(policyKey, value) {
            this.policies[policyKey] = clamp(Math.round(Number(value)), 0, 100);
            this.notify();
        }

        canBuyTechnology(technology) {
            return !this.unlockedTechnologies.has(technology.id) && this.capital >= technology.cost;
        }

        buyTechnology(technology) {
            if (!this.canBuyTechnology(technology)) {
                return false;
            }

            this.capital -= technology.cost;
            this.unlockedTechnologies.add(technology.id);
            this.logEntries.unshift({ turn: this.turn, title: `Tecnologia adquirida: ${technology.name}`, description: technology.effectLabel });
            this.logEntries = this.logEntries.slice(0, HISTORY_LIMIT);
            this.notify("toast", { type: "success", message: `${technology.name} adquirida com sucesso.` });
            this.notify();
            return true;
        }

        pushLog(title, description) {
            this.logEntries.unshift({ turn: this.turn, title, description });
            this.logEntries = this.logEntries.slice(0, HISTORY_LIMIT);
        }

        pushHistory(label) {
            this.history.push(this.createHistoryEntry(label));
            this.history = this.history.slice(-HISTORY_LIMIT);
        }

        commitTurn(result) {
            this.turn += 1;
            this.population = result.population;
            this.foodStock = result.foodStock;
            this.capital = result.capital;
            this.soilHealth = result.soilHealth;
            this.aquiferLevel = result.aquiferLevel;
            this.environmentalDebt = result.environmentalDebt;
            this.climateRisk = result.climateRisk;
            this.gini = result.gini;
            this.hunger = result.hunger;
            this.carryingCapacity = result.carryingCapacity;
            this.lastTurnSummary = { turn: this.turn, ...result };
            this.pushHistory(result.label);
            this.pushLog(result.label, result.logText);
            this.notify();
        }
    }

    // Algoritmos: concentra as equações de retroalimentação do sistema por turno.
    class SimulationEngine {
        constructor(eventBus) {
            this.eventBus = eventBus;
        }

        getFlags(state) {
            return {
                dripIrrigation: state.unlockedTechnologies.has("drip_irrigation"),
                resilientSeeds: state.unlockedTechnologies.has("resilient_seeds"),
                composting: state.unlockedTechnologies.has("community_composting"),
                logisticsCoop: state.unlockedTechnologies.has("logistics_coop")
            };
        }

        pickClimateEvent(state, rng, flags) {
            const chance = clamp(0.08 + state.climateRisk / 165, 0.08, 0.66);
            if (rng() > chance) {
                return null;
            }

            const droughtWeight = 18 + state.climateRisk * 0.7 + (100 - state.aquiferLevel) * 0.8 - (flags.dripIrrigation ? 10 : 0);
            const pestsWeight = 14 + state.climateRisk * 0.55 + state.agriculturalMatrix.monoculture * 0.8 - (flags.resilientSeeds ? 18 : 0);
            const floodWeight = 10 + state.climateRisk * 0.45 + (100 - state.soilHealth) * 0.5 + state.agriculturalMatrix.reserve * 0.18;
            const heatWeight = 12 + state.climateRisk * 0.5 + state.environmentalDebt * 0.25;

            return weightedChoice([
                { weight: droughtWeight, label: "⚠️ Seca severa", description: "Aquíferos caíram e a produção perdeu eficiência.", apply: (result, localFlags) => { result.aquiferLevel -= 12; result.soilHealth -= 4; result.foodMultiplier *= localFlags.dripIrrigation ? 0.9 : 0.82; result.climateRisk += 5; } },
                { weight: pestsWeight, label: "🐛 Surto de pragas", description: "Pragas afetaram o rendimento agrícola.", apply: (result, localFlags) => { result.foodMultiplier *= localFlags.resilientSeeds ? 0.95 : 0.78; result.soilHealth -= 7; result.environmentalDebt += 3; } },
                { weight: floodWeight, label: "🌊 Inundação localizada", description: "Chuvas intensas causaram erosão.", apply: result => { result.soilHealth -= 10; result.aquiferLevel -= 4; result.environmentalDebt += 5; result.foodMultiplier *= 0.9; } },
                { weight: heatWeight, label: "🔥 Onda de calor", description: "Evaporação aumentada e pressão hídrica ampliada.", apply: result => { result.aquiferLevel -= 8; result.foodMultiplier *= 0.89; result.populationShock -= 0.8; } }
            ], rng);
        }

        step(state, options = {}) {
            const rng = options.rng ?? Math.random;
            const headless = options.headless ?? false;
            const flags = this.getFlags(state);
            const matrix = state.agriculturalMatrix;

            const result = {
                population: state.population,
                foodStock: state.foodStock,
                capital: state.capital,
                soilHealth: state.soilHealth,
                aquiferLevel: state.aquiferLevel,
                environmentalDebt: state.environmentalDebt,
                climateRisk: state.climateRisk,
                gini: state.gini,
                hunger: state.hunger,
                carryingCapacity: state.carryingCapacity,
                label: `Turno ${state.turn + 1}`,
                logText: "",
                foodMultiplier: 1,
                populationShock: 0
            };

            const distribution = state.policies.distributionQuota / 100;
            const subsidy = state.policies.agriculturalSubsidy / 100;
            const waterDemand = matrix.monoculture * 1.15 + matrix.family * 0.82;
            const waterReduction = flags.dripIrrigation ? 0.6 : 1;

            result.environmentalDebt = clamp(result.environmentalDebt * 0.92 + matrix.monoculture * 0.22 + matrix.family * 0.07 - matrix.reserve * 0.18 - (flags.composting ? 2.2 : 0.6), 0, 100);
            result.soilHealth = clamp(result.soilHealth * Math.exp(-(result.environmentalDebt / 100) * 0.025) + matrix.reserve * 0.14 + (flags.composting ? 2.5 : 0.7) - matrix.monoculture * 0.05, 0, 100);
            result.aquiferLevel = clamp(result.aquiferLevel - (waterDemand * waterReduction * 0.055) + matrix.reserve * 0.22 + (flags.dripIrrigation ? 3.5 : 1.2), 0, 100);
            result.climateRisk = clamp(12 + result.environmentalDebt * 0.45 + (100 - result.aquiferLevel) * 0.32 + matrix.monoculture * 0.15 - matrix.reserve * 0.12 - (flags.resilientSeeds ? 4.5 : 0), 0, 100);

            const climateEvent = this.pickClimateEvent(state, rng, flags);
            if (climateEvent) {
                climateEvent.apply(result, flags);
                result.label = `${result.label} - ${climateEvent.label}`;
                result.logText = climateEvent.description;
                if (!headless && this.eventBus) {
                    this.eventBus.publish("toast", { type: "warning", message: `${climateEvent.label}! ${climateEvent.description}` });
                }
            }

            result.soilHealth = clamp(result.soilHealth, 0, 100);
            result.aquiferLevel = clamp(result.aquiferLevel, 0, 100);
            result.environmentalDebt = clamp(result.environmentalDebt, 0, 100);
            result.foodMultiplier = clamp(result.foodMultiplier, 0.5, 1.3);

            const baseProduction = (matrix.monoculture * 1.85 + matrix.family * 1.55 + matrix.reserve * 0.32) * (result.soilHealth / 100) * (0.58 + result.aquiferLevel / 170) * result.foodMultiplier;
            const totalProduction = baseProduction * (1 + subsidy * 0.14);
            const foodNeed = state.population * (0.72 + result.gini * 0.1);
            const accessEfficiency = clamp(0.72 + distribution * 0.24 + (flags.logisticsCoop ? 0.08 : 0), 0.65, 0.98);
            const accessibleFood = (state.foodStock + totalProduction) * accessEfficiency;
            const shortage = Math.max(0, foodNeed - accessibleFood);

            result.foodStock = clamp(state.foodStock + totalProduction - foodNeed, 0, foodNeed * 2.5);
            result.hunger = clamp(shortage / Math.max(1, foodNeed) * 100 + (1 - accessEfficiency) * 22, 0, 100);

            const healthFactor = clamp(1 - result.hunger / 145, 0.2, 1);
            const productivePopulation = state.population * healthFactor;
            const revenue = productivePopulation * (0.92 + result.soilHealth / 160) + result.foodStock * 0.04;
            const policyCost = state.policies.distributionQuota * 0.13 + state.policies.agriculturalSubsidy * 0.18;
            const maintenance = state.unlockedTechnologies.size * 3.4;

            result.capital = clamp(state.capital + revenue - policyCost - maintenance, 0, 99999);
            result.gini = clamp(0.22 + matrix.monoculture * 0.0014 + (100 - state.policies.distributionQuota) * 0.0019 + (100 - state.policies.agriculturalSubsidy) * 0.0015 + result.hunger * 0.0014 - (flags.logisticsCoop ? 0.045 : 0), 0.18, 0.85);

            const natality = 0.016 + matrix.reserve * 0.00012 + (flags.composting ? 0.0009 : 0) + state.policies.agriculturalSubsidy * 0.00003 - result.hunger * 0.00011 - result.gini * 0.005;
            const mortality = 0.006 + Math.pow(result.hunger / 100, 1.8) * 0.06 + (result.hunger > 30 ? Math.exp((result.hunger - 30) / 22) * 0.01 : 0) + (result.aquiferLevel < 25 ? 0.014 : 0);
            result.population = clamp(Math.round(state.population * (1 + natality - mortality - result.populationShock * 0.002)), 0, 999999);
            result.carryingCapacity = Math.round(70 + result.soilHealth * 1.15 + matrix.reserve * 0.6 - result.environmentalDebt * 0.4);
            result.logText = result.logText || `Produção líquida de ${formatInteger(totalProduction)} e fome em ${formatPercent(result.hunger)}.`;

            state.commitTurn({ ...result, label: result.label, logText: result.logText });

            if (!headless && this.eventBus) {
                this.eventBus.publish("toast", {
                    type: result.hunger > 45 ? "danger" : "success",
                    message: `Turno concluído. População ${formatInteger(result.population)}, fome ${formatPercent(result.hunger)}.`
                });
            }

            return result;
        }
    }

    // Algoritmos e abstração: executa 60 turnos em modo headless para responder "e se?".
    class PredictiveEngine {
        constructor(simulationEngine) {
            this.simulationEngine = simulationEngine;
        }

        project(state) {
            const rng = createSeededRng(Math.round(state.population + state.capital + state.turn * 97 + state.environmentalDebt * 11));
            const projectedState = GameState.fromSnapshot(state.snapshot());
            const notes = [];
            let turn = 0;

            while (turn < TURN_LIMIT) {
                const result = this.simulationEngine.step(projectedState, { headless: true, rng });
                if (result.logText) {
                    notes.push(result.logText);
                }
                turn += 1;
            }

            const aquiferStatus = projectedState.aquiferLevel <= 25 ? "Colapso" : projectedState.aquiferLevel >= 70 ? "Recuperado" : "Estável";
            const resilienceScore = projectedState.population / Math.max(1, state.population) * 18 + projectedState.soilHealth * 0.28 + (100 - projectedState.hunger) * 0.38 + projectedState.aquiferLevel * 0.18 - projectedState.gini * 32;

            let verdictTitle = "⚖️ Sobrevivência por Racionamento";
            let verdictText = "A comunidade continua ativa, mas depende de controle rígido de recursos e decisões corretivas constantes.";

            if (resilienceScore >= 62 && projectedState.population >= state.population * 1.08 && projectedState.soilHealth >= 68 && projectedState.gini <= 0.38) {
                verdictTitle = "🌱 Utopia Autossustentável";
                verdictText = "As interdependências foram equilibradas e o sistema se tornou resiliente, produtivo e socialmente mais justo.";
            } else if (resilienceScore < 38 || projectedState.aquiferLevel < 25 || projectedState.soilHealth < 35 || projectedState.population < state.population * 0.7) {
                verdictTitle = "💀 Colapso Sistêmico e Êxodo";
                verdictText = "A degradação ambiental e social superou a capacidade de recuperação, levando a perdas severas e fuga populacional.";
            }

            return {
                finalPopulation: projectedState.population,
                aquiferStatus,
                gini: projectedState.gini,
                soilHealth: projectedState.soilHealth,
                hunger: projectedState.hunger,
                climateRisk: projectedState.climateRisk,
                capital: projectedState.capital,
                verdictTitle,
                verdictText,
                notes: notes.slice(0, 4)
            };
        }
    }

    // Decomposição: persistência isolada da interface.
    class StorageManager {
        constructor(storageKey) {
            this.storageKey = storageKey;
        }

        save(state) {
            localStorage.setItem(this.storageKey, JSON.stringify(state.snapshot()));
        }

        load(eventBus = null) {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return null;
            }

            return GameState.fromSnapshot(JSON.parse(raw), eventBus);
        }
    }

    // Observer na interface: reage às mudanças do GameState e redesenha DOM, canvas e relatórios.
    class UIController {
        constructor({ eventBus, state, simulationEngine, predictiveEngine, storageManager }) {
            this.eventBus = eventBus;
            this.state = state;
            this.simulationEngine = simulationEngine;
            this.predictiveEngine = predictiveEngine;
            this.storageManager = storageManager;
            this.elements = this.collectElements();
        }

        collectElements() {
            return {
                heroTurn: document.getElementById("heroTurn"),
                heroClimate: document.getElementById("heroClimate"),
                heroScore: document.getElementById("heroScore"),
                turnProgress: document.getElementById("turnProgress"),
                statsGrid: document.getElementById("statsGrid"),
                matrixControls: document.getElementById("matrixControls"),
                techTree: document.getElementById("techTree"),
                policyControls: document.getElementById("policyControls"),
                eventLog: document.getElementById("eventLog"),
                toastContainer: document.getElementById("toastContainer"),
                reportModal: document.getElementById("reportModal"),
                reportContent: document.getElementById("reportContent"),
                historyChart: document.getElementById("historyChart"),
                foodStatus: document.getElementById("foodStatus"),
                soilStatus: document.getElementById("soilStatus"),
                waterStatus: document.getElementById("waterStatus"),
                giniStatus: document.getElementById("giniStatus"),
                summaryHunger: document.getElementById("summaryHunger"),
                summaryFood: document.getElementById("summaryFood"),
                summaryCapital: document.getElementById("summaryCapital"),
                summaryHistory: document.getElementById("summaryHistory"),
                nextTurnBtn: document.getElementById("nextTurnBtn"),
                predictBtn: document.getElementById("predictBtn"),
                saveBtn: document.getElementById("saveBtn"),
                loadBtn: document.getElementById("loadBtn"),
                resetBtn: document.getElementById("resetBtn")
            };
        }

        init() {
            this.bindEvents();
            this.subscribeToBus();
            this.renderStaticPanels();
            this.render(this.state.snapshot());
        }

        bindEvents() {
            this.elements.nextTurnBtn.addEventListener("click", () => {
                this.animateTurnProgress();
                this.simulationEngine.step(this.state);
            });

            this.elements.predictBtn.addEventListener("click", () => this.openReport(this.predictiveEngine.project(this.state)));

            this.elements.saveBtn.addEventListener("click", () => {
                this.storageManager.save(this.state);
                this.showToast("Jogo salvo no armazenamento local.", "success");
            });

            this.elements.loadBtn.addEventListener("click", () => {
                const loaded = this.storageManager.load(this.eventBus);
                if (!loaded) {
                    this.showToast("Nenhum jogo salvo foi encontrado.", "warning");
                    return;
                }

                this.state = loaded;
                this.renderStaticPanels();
                this.render(this.state.snapshot());
                this.showToast("Jogo carregado com sucesso.", "success");
            });

            this.elements.resetBtn.addEventListener("click", () => {
                this.state = new GameState(this.eventBus);
                this.renderStaticPanels();
                this.render(this.state.snapshot());
                this.showToast("Nova simulação iniciada.", "success");
            });

            document.querySelectorAll("[data-close-modal]").forEach(button => {
                button.addEventListener("click", () => this.closeReport());
            });

            this.elements.reportModal.addEventListener("click", event => {
                if (event.target === this.elements.reportModal) {
                    this.closeReport();
                }
            });
        }

        subscribeToBus() {
            this.eventBus.subscribe("state:changed", payload => this.render(payload.state));
            this.eventBus.subscribe("toast", payload => this.showToast(payload.message, payload.type ?? "success"));
        }

        renderStaticPanels() {
            this.renderMatrixControls();
            this.renderTechTree();
            this.renderPolicyControls();
        }

        render(snapshot) {
            this.renderHeader(snapshot);
            this.renderOverview(snapshot);
            this.renderLog(snapshot);
            this.renderChart(snapshot.history ?? []);
        }

        renderHeader(snapshot) {
            this.elements.heroTurn.textContent = String(snapshot.turn).padStart(2, "0");
            this.elements.heroClimate.textContent = this.describeClimate(snapshot.climateRisk);
            this.elements.heroScore.textContent = String(Math.round(this.computeEcoScore(snapshot)));
        }

        computeEcoScore(snapshot) {
            return clamp(snapshot.soilHealth * 0.3 + (100 - snapshot.hunger) * 0.3 + (100 - snapshot.gini * 100) * 0.18 + snapshot.aquiferLevel * 0.12 + snapshot.population / 12, 0, 100);
        }

        describeClimate(value) {
            if (value < 30) {
                return "Estável";
            }

            if (value < 60) {
                return "Tenso";
            }

            return "Crítico";
        }

        renderOverview(snapshot) {
            const cards = [
                { label: "População", value: formatInteger(snapshot.population), detail: `Capacidade de suporte: ${formatInteger(snapshot.carryingCapacity)}` },
                { label: "Estoque de alimentos", value: formatInteger(snapshot.foodStock), detail: `Fome: ${formatPercent(snapshot.hunger)} total` },
                { label: "Capital", value: formatInteger(snapshot.capital), detail: "Financia políticas e tecnologias" },
                { label: "Saúde do solo", value: formatPercent(snapshot.soilHealth), detail: `Dívida ambiental: ${formatPercent(snapshot.environmentalDebt)}` },
                { label: "Aquíferos", value: formatPercent(snapshot.aquiferLevel), detail: `Clima: ${formatPercent(snapshot.climateRisk)}` },
                { label: "Desigualdade", value: formatDecimal(snapshot.gini, 2), detail: snapshot.gini <= 0.35 ? "Distribuição equilibrada" : "Pressão social elevada" },
                { label: "Matriz agrícola", value: `${snapshot.agriculturalMatrix.monoculture}% / ${snapshot.agriculturalMatrix.family}% / ${snapshot.agriculturalMatrix.reserve}%`, detail: "Monocultura / Familiar / Reserva" },
                { label: "Tecnologias", value: `${snapshot.unlockedTechnologies.length} desbloqueadas`, detail: "Melhorias permanentes já adquiridas" }
            ];

            this.elements.statsGrid.innerHTML = cards.map(card => `
                <article class="stat-card">
                    <div class="stat-label">${card.label}</div>
                    <strong class="metric-value">${card.value}</strong>
                    <div class="metric-detail">${card.detail}</div>
                </article>
            `).join("");

            this.elements.summaryHunger.textContent = formatPercent(snapshot.hunger);
            this.elements.summaryFood.textContent = formatInteger(snapshot.foodStock);
            this.elements.summaryCapital.textContent = formatInteger(snapshot.capital);
            this.elements.summaryHistory.textContent = `${Math.min(snapshot.history?.length ?? 0, 12)} turnos`;

            this.setStatusChip(this.elements.foodStatus, snapshot.hunger < 25 ? "Equilibrado" : snapshot.hunger < 55 ? "Sob pressão" : "Crítico", snapshot.hunger < 25 ? "ok" : snapshot.hunger < 55 ? "warn" : "bad");
            this.setStatusChip(this.elements.soilStatus, snapshot.soilHealth > 68 ? "Solo saudável" : snapshot.soilHealth > 40 ? "Solo em alerta" : "Solo degradado", snapshot.soilHealth > 68 ? "ok" : snapshot.soilHealth > 40 ? "warn" : "bad");
            this.setStatusChip(this.elements.waterStatus, snapshot.aquiferLevel > 65 ? "Aquíferos estáveis" : snapshot.aquiferLevel > 35 ? "Reserva moderada" : "Colapso hídrico", snapshot.aquiferLevel > 65 ? "ok" : snapshot.aquiferLevel > 35 ? "warn" : "bad");
            this.setStatusChip(this.elements.giniStatus, snapshot.gini < 0.35 ? "Baixa desigualdade" : snapshot.gini < 0.5 ? "Desigualdade moderada" : "Alta desigualdade", snapshot.gini < 0.35 ? "ok" : snapshot.gini < 0.5 ? "warn" : "bad");
        }

        setStatusChip(element, text, type) {
            element.textContent = text;
            element.className = `status-chip ${type}`;
        }

        renderMatrixControls() {
            const controls = [
                { key: "monoculture", label: "Monocultura de Exportação", description: "Alta produtividade no curto prazo, porém com forte pressão sobre o solo e a biodiversidade." },
                { key: "family", label: "Agricultura Familiar", description: "Equilibra renda, segurança alimentar e menor agressão ambiental." },
                { key: "reserve", label: "Reserva Florestal", description: "Reduz risco climático, recupera o solo e estabiliza o ciclo hídrico." }
            ];

            this.elements.matrixControls.innerHTML = controls.map(control => {
                const value = this.state.agriculturalMatrix[control.key];
                return `
                    <div class="slider-card">
                        <div class="slider-header">
                            <div>
                                <h3>${control.label}</h3>
                                <p class="slider-hint">${control.description}</p>
                            </div>
                            <strong class="slider-value">${value}%</strong>
                        </div>
                        <input type="range" min="0" max="100" step="1" value="${value}" data-matrix-control="${control.key}">
                    </div>
                `;
            }).join("");

            this.elements.matrixControls.querySelectorAll("[data-matrix-control]").forEach(input => {
                input.addEventListener("input", event => {
                    this.state.setAgriculturalAllocation(event.target.dataset.matrixControl, event.target.value);
                });
            });
        }

        renderTechTree() {
            this.elements.techTree.innerHTML = TECH_DEFINITIONS.map(technology => {
                const acquired = this.state.unlockedTechnologies.has(technology.id);
                const canBuy = this.state.canBuyTechnology(technology);
                const status = acquired ? "Adquirido" : canBuy ? "Disponível" : "Bloqueado";
                const pillClass = acquired ? "acquired" : canBuy ? "available" : "blocked";

                return `
                    <article class="tech-card">
                        <div class="tech-header">
                            <div>
                                <h3>${technology.name}</h3>
                                <div class="tech-meta">
                                    <span class="tech-pill ${pillClass}">${status}</span>
                                    <span class="tech-pill">Custo: ${formatInteger(technology.cost)}</span>
                                </div>
                            </div>
                            <strong class="tech-cost mono">${technology.cost}</strong>
                        </div>
                        <p class="tech-description">${technology.description}</p>
                        <div class="policy-meta"><span class="policy-pill">${technology.effectLabel}</span></div>
                        <div class="tech-actions">
                            <button class="tech-action" data-buy-tech="${technology.id}" ${acquired || !canBuy ? "disabled" : ""}>${acquired ? "Adquirido" : canBuy ? "Investir" : "Capital insuficiente"}</button>
                        </div>
                    </article>
                `;
            }).join("");

            this.elements.techTree.querySelectorAll("[data-buy-tech]").forEach(button => {
                button.addEventListener("click", event => {
                    const technology = TECH_DEFINITIONS.find(item => item.id === event.target.dataset.buyTech);
                    if (!technology) {
                        return;
                    }

                    const acquired = this.state.buyTechnology(technology);
                    if (acquired) {
                        this.render(this.state.snapshot());
                    } else {
                        this.showToast("Capital insuficiente ou tecnologia já adquirida.", "warning");
                    }
                });
            });
        }

        renderPolicyControls() {
            const policies = [
                { key: "distributionQuota", label: "Cota de distribuição de alimentos", description: "Aumenta o acesso aos alimentos e reduz a desigualdade percebida no sistema." },
                { key: "agriculturalSubsidy", label: "Subsídio à agricultura familiar", description: "Impulsiona a produção local, mas pressiona o orçamento mensal." }
            ];

            this.elements.policyControls.innerHTML = policies.map(policy => {
                const value = this.state.policies[policy.key];
                return `
                    <div class="policy-card">
                        <div class="policy-header">
                            <div>
                                <h3>${policy.label}</h3>
                                <p class="policy-description">${policy.description}</p>
                            </div>
                            <strong class="policy-value">${value}%</strong>
                        </div>
                        <input type="range" min="0" max="100" step="1" value="${value}" data-policy-control="${policy.key}">
                    </div>
                `;
            }).join("");

            this.elements.policyControls.querySelectorAll("[data-policy-control]").forEach(input => {
                input.addEventListener("input", event => {
                    this.state.setPolicy(event.target.dataset.policyControl, event.target.value);
                });
            });
        }

        renderLog(snapshot) {
            this.elements.eventLog.innerHTML = (snapshot.logEntries ?? []).slice(0, 12).map(entry => `
                <article class="event-item">
                    <strong>Turno ${entry.turn} | ${entry.title}</strong>
                    <small>${entry.description}</small>
                </article>
            `).join("");
        }

        renderChart(history) {
            const canvas = this.elements.historyChart;
            const context = canvas.getContext("2d");
            const ratio = window.devicePixelRatio || 1;
            const width = canvas.clientWidth || canvas.width;
            const height = Math.max(260, Math.round(width * 0.28));

            canvas.width = width * ratio;
            canvas.height = height * ratio;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.clearRect(0, 0, width, height);

            const recentHistory = history.slice(-12);
            const padding = { top: 24, right: 28, bottom: 36, left: 40 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;
            const maxPoints = Math.max(2, recentHistory.length);

            context.fillStyle = "rgba(255,255,255,0.04)";
            context.fillRect(0, 0, width, height);
            context.strokeStyle = "rgba(255,255,255,0.08)";
            context.lineWidth = 1;

            for (let index = 0; index <= 4; index += 1) {
                const y = padding.top + chartHeight / 4 * index;
                context.beginPath();
                context.moveTo(padding.left, y);
                context.lineTo(width - padding.right, y);
                context.stroke();
            }

            const drawSeries = (key, color) => {
                if (recentHistory.length < 2) {
                    return;
                }

                context.beginPath();
                recentHistory.forEach((entry, index) => {
                    const x = padding.left + chartWidth / (maxPoints - 1) * index;
                    const normalized = clamp(entry[key] ?? 0, 0, 100) / 100;
                    const y = padding.top + chartHeight - normalized * chartHeight;
                    if (index === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                });
                context.strokeStyle = color;
                context.lineWidth = 3;
                context.stroke();

                recentHistory.forEach((entry, index) => {
                    const x = padding.left + chartWidth / (maxPoints - 1) * index;
                    const normalized = clamp(entry[key] ?? 0, 0, 100) / 100;
                    const y = padding.top + chartHeight - normalized * chartHeight;
                    context.beginPath();
                    context.fillStyle = color;
                    context.arc(x, y, 4, 0, Math.PI * 2);
                    context.fill();
                });
            };

            drawSeries("hunger", "#ff5c7a");
            drawSeries("soilHealth", "#00e676");

            context.fillStyle = "rgba(231, 243, 234, 0.8)";
            context.font = "12px Consolas, monospace";
            context.fillText("Fome", width - 110, 24);
            context.fillStyle = "#ff5c7a";
            context.fillRect(width - 154, 16, 16, 3);
            context.fillStyle = "rgba(231, 243, 234, 0.8)";
            context.fillText("Solo", width - 110, 44);
            context.fillStyle = "#00e676";
            context.fillRect(width - 154, 36, 16, 3);
        }

        animateTurnProgress() {
            this.elements.turnProgress.style.width = "0%";
            requestAnimationFrame(() => {
                this.elements.turnProgress.style.width = "100%";
            });

            window.setTimeout(() => {
                this.elements.turnProgress.style.width = "0%";
            }, 620);
        }

        showToast(message, type = "success") {
            const toast = document.createElement("div");
            toast.className = `toast ${type}`;
            toast.textContent = message;
            this.elements.toastContainer.appendChild(toast);

            window.setTimeout(() => {
                toast.style.opacity = "0";
                toast.style.transform = "translateX(12px)";
                window.setTimeout(() => toast.remove(), 240);
            }, 2600);
        }

        openReport(report) {
            this.elements.reportContent.innerHTML = `
                <div class="report-grid">
                    <article class="report-card"><span class="report-label">Projeção populacional final</span><strong class="report-value">${formatInteger(report.finalPopulation)}</strong></article>
                    <article class="report-card"><span class="report-label">Status dos aquíferos</span><strong class="report-value">${report.aquiferStatus}</strong></article>
                    <article class="report-card"><span class="report-label">Índice de Gini projetado</span><strong class="report-value">${formatDecimal(report.gini, 2)}</strong></article>
                    <article class="report-card"><span class="report-label">Saúde do solo</span><strong class="report-value">${formatPercent(report.soilHealth)}</strong></article>
                    <article class="report-card"><span class="report-label">Fome projetada</span><strong class="report-value">${formatPercent(report.hunger)}</strong></article>
                    <article class="report-card"><span class="report-label">Capital projetado</span><strong class="report-value">${formatInteger(report.capital)}</strong></article>
                </div>
                <div class="verdict-box">
                    <strong>${report.verdictTitle}</strong>
                    <p>${report.verdictText}</p>
                </div>
                <div class="modal-content">
                    <p class="panel-note">A projeção usa um loop <span class="mono">while</span> de 60 turnos sem tocar no DOM. Isso representa algoritmos com abstração do estado visual.</p>
                    ${report.notes.map(note => `<p class="policy-description">• ${note}</p>`).join("")}
                </div>
            `;

            this.elements.reportModal.classList.add("is-open");
            this.elements.reportModal.setAttribute("aria-hidden", "false");
        }

        closeReport() {
            this.elements.reportModal.classList.remove("is-open");
            this.elements.reportModal.setAttribute("aria-hidden", "true");
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const eventBus = new EventBus();
        const state = new GameState(eventBus);
        const simulationEngine = new SimulationEngine(eventBus);
        const predictiveEngine = new PredictiveEngine(simulationEngine);
        const storageManager = new StorageManager(STORAGE_KEY);
        const uiController = new UIController({ eventBus, state, simulationEngine, predictiveEngine, storageManager });

        uiController.init();
    });
})();