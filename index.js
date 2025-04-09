#!/bin/node

import { js2xml, xml2js } from 'xml-js';
import fs from 'fs';
import {
    JsEmpty, JsDir, JsField, JsFields, JsAttribute, JsAttributes, JsFieldAttribute, JsUniverses,
    JsFixtureFromModel, JsFunctionPlasmaRainbow, JsFunctionAudioSpectrum, JsSliderPlayback, JsSpeedDial, JsLabel,
    JsFunctionWaves, JsFunctionRandomSingle, JsFunctionPlasmaColors, JsFunctionPlasmaGradient, JsFunctionPlasmaPlain,
    JsButton, JsFunctionScene, JsFunctionSequence, JsSliderLevel, JsSliderSubmaster
} from './JsClasses.js';
import FixtureModels from './fixtureModels.js';

let config = {};

const copyObject = serializable => JSON.parse(JSON.stringify(serializable, 'utf8'));

const getJsObj = (elements = []) => {
    const creator = new JsFields({ Creator: [{ Name: "Q Light Controller Plus" }, { Version: "4.13.1" }, { Author: "AVSalon" }] })
    return {
        declaration: { attributes: { version: "1.0", encoding: "UTF-8" } },
        elements: [
            { type: 'doctype', doctype: 'Workspace' },
            {
                ...new JsAttribute({ Workspace: { xmlns: "http://www.qlcplus.org/Workspace", CurrentWindow: "VirtualConsole" } }),
                elements: [creator].concat(elements)
            }
        ]
    };
}
const getEngine = (elements = []) => {
    const inputOutputMap = new JsUniverses({
        InputOutputMap: [
            { BeatType: 'Disabled', BPM: 0 },
            { id: 0, midi: 1 },
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 }
        ]
    });
    return new JsDir('Engine', [inputOutputMap].concat(elements));
}

const getFixtureGroup = (id = 0, quantity = 1, address = 0, name = "") => {
    const heads = new Array(quantity).fill({}).map((_item, index) => new JsFieldAttribute({ Head: 0, attributes: { X: 0, Y: index, Fixture: address + index } }));
    return {
        ...new JsAttribute({ FixtureGroup: { ID: id } }),
        elements: [
            new JsField({ Name: `${name}Group${id}` }),
            new JsAttribute({ Size: { X: 1, Y: quantity } }),
        ].concat(heads)
    };
}
const getReversFixtureGroup = (id = 0, quantity = 1, address = 0, name = "") => {
    const heads = new Array(quantity).fill({}).map((_item, index) => new JsFieldAttribute({ Head: 0, attributes: { X: 0, Y: index, Fixture: address + quantity - index - 1 } }));
    return {
        ...new JsAttribute({ FixtureGroup: { ID: id } }),
        elements: [
            new JsField({ Name: `${name}Group${id}` }),
            new JsAttribute({ Size: { X: 1, Y: quantity } }),
        ].concat(heads)
    };
}

const writeXml = () => {
    let sequenceId = 0;
    const getFixtures = () => {
        let quantity = {};
        const fixtures = config.engine.fixtures.map(fixture => {
            const ratio = Object.keys(quantity).length > 0 ? Object.values(quantity).reduce((accumulator, currentValue) => accumulator + currentValue) : 0;
            quantity[fixture.mode] = fixture.quantity;
            const fixtureModel = FixtureModels[fixture.manufacturer][fixture.model][fixture.mode];
            return new Array(fixture.quantity).fill({}).map((_item, index) => new JsFixtureFromModel(index + ratio, fixtureModel, fixture.universe, fixture.mode != 'dimmerRgb' ? (index != 0 ? index * fixtureModel.addresses : 0) : [9, 19][index]));
        }).flat();
        const quantityMain = config.engine.groups.main.quantity;
        const quantitySide = config.engine.groups.side.quantity;
        const quantityLine = config.engine.groups.line.quantity;
        const groups = [getFixtureGroup(0, quantity.grb, undefined, "Main")]
            .concat(new Array(quantitySide).fill({}).map((_item, index) => {
                return index % 2 === 0 ? getFixtureGroup(index + quantityMain, quantity.grb / quantitySide, index * (quantity.grb / quantitySide), "Audio") : getReversFixtureGroup(index + quantityMain, quantity.grb / quantitySide, index * (quantity.grb / quantitySide), "Audio");
            }))
            .concat(quantityLine > 0 ? new Array(quantityLine).fill({}).map((_item, index) => {
                return index % 2 === 0 ? getReversFixtureGroup(index + quantityMain + quantitySide, quantity.grb / quantityLine, index * (quantity.grb / quantityLine), "Part") : getFixtureGroup(index + quantityMain + quantitySide, quantity.grb / quantityLine, index * (quantity.grb / quantityLine), "Part");
            }) : []);
        const { line, colorWaves, flash, gazebo, gazeboMusic, gazeboBlack } = config.engine.functions;
        const functions = [new JsFunctionPlasmaRainbow(undefined, undefined, undefined, "Main")]
            .concat(new Array(quantitySide).fill({}).map((_item, index) => new JsFunctionAudioSpectrum(index + quantityMain, index + quantityMain, undefined, "Audio")))
            .concat(quantityLine > 0 ? new Array(quantityLine).fill({}).map((_item, index) => new JsFunctionWaves(index + quantityMain + quantitySide, index + quantityMain + quantitySide, line.color[index], false, line.duration[index], "Part")) : [])
            .concat(colorWaves.direction.map((direction, index) => new JsFunctionWaves(index + quantityMain + quantitySide + quantityLine, 0, colorWaves.color[index], direction == 'left', undefined, "ColorWaves")))
            .concat([new JsFunctionRandomSingle(quantityMain + quantitySide + quantityLine + colorWaves.quantity, 0, flash.color, flash.duration, "Flash")])
            .concat(gazebo.duration.map((duration, index) => new JsFunctionPlasmaColors(index + quantityMain + quantitySide + quantityLine + colorWaves.quantity + flash.quantity, 0, duration, gazebo.color1Index[index], gazebo.color2Index[index], gazebo.color3Index[index], gazebo.color4Index[index], gazebo.stepsize[index], gazebo.ramp[index], "Gazebo")))
            .concat([new JsFunctionPlasmaGradient(quantityMain + quantitySide + quantityLine + colorWaves.quantity + flash.quantity + gazebo.quantity, 0, gazeboMusic.duration, "GazeboMusic")])
            .concat([new JsFunctionPlasmaPlain(quantityMain + quantitySide + quantityLine + colorWaves.quantity + flash.quantity + gazebo.quantity + gazeboMusic.quantity, 0, gazeboBlack.duration, "GazeboBlack")]);
        const scene = new JsFunctionScene(functions.length, quantity.grb, 0, "Main");
        sequenceId = functions.length + 1;
        const sequence = new JsFunctionSequence(sequenceId, quantity.grb, 50, functions.length, "Sequence");
        return fixtures.concat(groups).concat(functions.concat([scene, sequence]));
    }
    const getVirtualConsole = () => {
        const quantityMain = config.engine.groups.main.quantity;
        const quantitySide = config.engine.groups.side.quantity;
        const quantityLine = config.engine.groups.line.quantity;
        const { side, line, colorWaves, flash } = config.virtualConsole;
        const functionColorWaves = config.engine.functions.colorWaves;
        const functionFlash = config.engine.functions.flash;
        const midiParRGB = [, ...config.virtualConsole.parRGB.slider.midi];
        const sliders = [new JsSliderPlayback()]
            .concat(new Array(quantitySide).fill({}).map((_item, index) => new JsSliderPlayback(index + quantityMain, `Group${index + 1}AudioSpectrum`, index + quantityMain, 4292730333, (index + quantityMain) * 75, 265, side.slider.midi[index] + 128)))
            .concat(new Array(quantityLine).fill({}).map((_item, index) => new JsSliderPlayback(index + quantitySide + quantityMain, `Group${index + quantitySide + 1}Waves`, index + quantitySide + quantityMain, undefined, index * 300 + 75, 475, line.slider.midi[index] + 128)))
            .concat(functionColorWaves.names.map((name, index) => new JsSliderPlayback(index + quantitySide + quantityLine + quantityMain, name, index + quantitySide + quantityLine + 1, undefined, (index + 1) * 300 + 75, undefined, colorWaves.slider.midi[index] + 128)))
            .concat(new JsSliderPlayback(quantityMain + quantitySide + quantityLine + functionColorWaves.quantity, 'Flash', quantityMain + quantitySide + quantityLine + functionColorWaves.quantity, undefined, (functionColorWaves.quantity + quantityMain) * 300 + 75, undefined, flash.slider.midi + 128));
        const functionLine = config.engine.functions.line;
        const speedDials = [new JsSpeedDial(sliders.length, undefined, 0, undefined, undefined, undefined, config.virtualConsole.main.speedDial.min, config.virtualConsole.main.speedDial.max, config.engine.functions.main.duration)]
            .concat(new Array(quantityLine).fill({}).map((_item, index) => new JsSpeedDial(index + sliders.length + quantityMain, `Group${index + quantitySide + 1}Waves`, index + quantitySide + quantityMain, undefined, index * 300 + 150, 475, line.speedDial.min, line.speedDial.max, functionLine.duration[index], line.speedDial.midi[index] + 128)))
            .concat(functionColorWaves.names.map((name, index) => new JsSpeedDial(index + sliders.length + quantityLine + quantityMain, name, index + quantitySide + quantityLine + quantityMain, undefined, (index + 1) * 300 + 150, undefined, colorWaves.speedDial.min, colorWaves.speedDial.max, functionColorWaves.duration, colorWaves.speedDial.midi[index] + 128)))
            .concat(new JsSpeedDial(sliders.length + quantityLine + functionColorWaves.quantity + quantityMain, 'Flash', quantitySide + quantityLine + functionColorWaves.quantity + quantityMain, undefined, (functionColorWaves.quantity + quantityMain) * 300 + 150, undefined, flash.speedDial.min, flash.speedDial.max, functionFlash.duration, flash.speedDial.midi + 128));
        const labels = ['Sides', 'Sfx'].map((label, index) => new JsLabel(index + sliders.length + speedDials.length, label, label == 'Sides' ? 4292730333 : undefined, (index + 1) * 210 + 55));
        let idCounter = sliders.length + speedDials.length + labels.length;
        const midiMainFrame = config.virtualConsole.mainframe.slider.midi;
        const mainframe = [{
            ...new JsAttribute({ Frame: { Caption: "", ID: idCounter++ } }),
            elements: [
                new JsFields({ Appearance: [{ FrameStyle: "Sunken" }, { ForegroundColor: "Default" }, { BackgroundColor: "Default" }, { BackgroundImage: "None" }, { Font: "Default" }] }),
                new JsAttribute({ WindowState: { Visible: "True", X: 15, Y: 15, Width: (functionColorWaves.quantity + quantityMain + 1) * 300 + 73, Height: (labels.length + 1) * 210 + 56 } }),
                new JsField({ AllowChildren: 'True' }),
                new JsField({ AllowResize: 'True' }),
                new JsField({ ShowHeader: 'True' }),
                new JsField({ ShowEnableButton: 'True' }),
                new JsField({ Collapsed: 'False' }),
                new JsField({ Disabled: 'False' }),
                new JsSliderSubmaster(idCounter++, "Submaster", undefined, 5, 55, 255, midiMainFrame + 128)
            ].concat(sliders).concat(speedDials).concat(labels)
        }];
        const parSlides = [
            { name: 'Dimmer', value: 255, channel: 0 },
            { name: 'Red', value: 0, channel: 1 },
            { name: 'Green', value: 0, channel: 2 },
            { name: 'Blue', value: 0, channel: 3 }
        ].map((item, index) => new JsSliderLevel(idCounter++, item.name, undefined, quantityLine * 300 + index * 75 + 90, 490, item.value, item.channel, [120, 121], midiParRGB[index] + 128))
        const quantityGazebo = config.engine.functions.gazebo.quantity;
        const gazebo = config.virtualConsole.gazebo.button;
        const gazeboMusic = config.virtualConsole.gazeboMusic.button;
        const gazeboBlack = config.virtualConsole.gazeboBlack.button;
        const soloFrame = [{
            ...new JsAttribute({ SoloFrame: { Caption: "", ID: idCounter++ } }),
            elements: [
                new JsFields({ Appearance: [{ FrameStyle: "Sunken" }, { ForegroundColor: "Default" }, { BackgroundColor: "Default" }, { BackgroundImage: "None" }, { Font: "Default" }] }),
                new JsAttribute({ WindowState: { Visible: "True", X: (functionColorWaves.quantity + quantityMain + functionFlash.quantity) * 300 + 100, Y: 15, Width: 95, Height: 470 } }),
                new JsField({ AllowChildren: 'True' }),
                new JsField({ AllowResize: 'True' }),
                new JsField({ ShowHeader: 'True' }),
                new JsField({ ShowEnableButton: 'True' }),
                new JsField({ Mixing: 'False' }),
                new JsField({ Collapsed: 'False' }),
                new JsField({ Disabled: 'False' }),
            ].concat(new Array(quantityGazebo).fill({}).map((_item, index) => new JsButton(idCounter++, `Gazebo${index + 1}`, index + quantityMain + quantitySide + quantityLine + functionColorWaves.quantity + functionFlash.quantity, 24, (index + 1) * 65, gazebo.intensity.value, gazebo.intensity.adjust, gazebo.midi[index] + 128)))
                .concat([
                    new JsButton(idCounter++, `GazeboMusic`, quantityMain + quantitySide + quantityLine + functionColorWaves.quantity + functionFlash.quantity + quantityGazebo, 24, (quantityGazebo + 1) * 65, gazeboMusic.intensity.value, gazeboMusic.intensity.adjust, gazeboMusic.midi + 128),
                    new JsButton(idCounter++, `GazeboBlack`, quantityMain + quantitySide + quantityLine + functionColorWaves.quantity + functionFlash.quantity + quantityGazebo + 1, 24, (quantityGazebo + 2) * 65, gazeboBlack.intensity.value, gazeboBlack.intensity.adjust, gazeboBlack.midi + 128)
                ])
        }];
        let midiLineFiller = config.virtualConsole.lineFiller.button.midi;
        const frame = [{
            ...new JsAttribute({ Frame: { Caption: "", ID: idCounter++ } }),
            elements: [
                new JsFields({ Appearance: [{ FrameStyle: "Sunken" }, { ForegroundColor: "Default" }, { BackgroundColor: "Default" }, { BackgroundImage: "None" }, { Font: "Default" }] }),
                new JsAttribute({ WindowState: { Visible: "True", X: (functionColorWaves.quantity + quantityMain + functionFlash.quantity) * 300 + 207, Y: 15, Width: 180, Height: 470 } }),
                new JsField({ AllowChildren: 'True' }),
                new JsField({ AllowResize: 'True' }),
                new JsField({ ShowHeader: 'True' }),
                new JsField({ ShowEnableButton: 'True' }),
                new JsField({ Collapsed: 'False' }),
                new JsField({ Disabled: 'False' }),
                new JsSliderSubmaster(idCounter++, "Submaster", undefined, 24, 65),
                new JsButton(idCounter, "Sequence", sequenceId, 106, 65, undefined, undefined, midiLineFiller + 128)
            ]
        }];
        return new JsDir('VirtualConsole', [
            {
                ...new JsAttribute({ Frame: { Caption: "" } }),
                elements: [
                    new JsFields({ Appearance: [{ FrameStyle: "None" }, { ForegroundColor: "Default" }, { BackgroundColor: "Default" }, { BackgroundImage: "None" }, { Font: "Default" }] }),
                ].concat(mainframe.concat(parSlides).concat(soloFrame).concat(frame))
            },
            new JsAttributes({
                Properties:
                    [{ Size: { Width: "1920", Height: "1080" } }, { GrandMaster: { ChannelMode: "Intensity", ValueMode: "Reduce", SliderMode: "Normal" } }]
            })
        ])
    };
    const simpleDesk = new JsDir('SimpleDesk', new JsEmpty('Engine'));
    const options = { compact: false, spaces: 1 };
    const xml = js2xml(getJsObj([getEngine(getFixtures()), getVirtualConsole(), simpleDesk]), options);
    // console.log(xml);
    fs.writeFile(`project.qxw`, xml, 'utf8', (error, stdout, stderr) => {
        console.log(error || 'Completed successfully');
    });
}

const checkData = (quantity, side, line) => {
    return quantity % side === 0 && side % 2 === 0 && quantity % line === 0;
}

const configFromJSON = data => {
    try {
        config = copyObject(JSON.parse(data));
        if (checkData(config.engine.fixtures[0].quantity, config.engine.groups.side.quantity, config.engine.groups.line.quantity)) {
            writeXml();
        }
    } catch (e) {
        if (e.name == 'SyntaxError') {
            config = copyObject({});
        } else {
            console.log(`Error (${e.name}) in data received from device_conf file`);
            throw e;
        }
    }
}

fs.readFile(`${process.cwd()}/config.json`, 'utf-8', (error, data) => {
    if (error) {
        if (error.message.indexOf('no such file or directory' < 0)) {
            config = copyObject({});
        } else {
            configFromJSON(data);
        }
    } else {
        if (data === "") {
            config = copyObject({});
        } else {
            configFromJSON(data);
        }
    }
});