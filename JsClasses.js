import FixtureModels from "./fixtureModels.js";
import { FixtureMode } from "./fixtureType.js";

export class JsEmpty {
    constructor(name) {
        this.type = 'element';
        this.name = name;
    }
}
export class JsDir extends JsEmpty {
    constructor(name, elements) {
        super(name);
        this.elements = Array.isArray(elements) ? elements : [elements];
    }
}
class Text {
    constructor(text) {
        this.type = 'text';
        this.text = text;
    }
}
export class JsField extends JsDir {
    constructor(obj) {
        const [key, value] = Object.entries(obj)[0];
        super(key, new Text(value));
    }
}
export class JsFields extends JsDir {
    constructor(obj) {
        const [key, value] = Object.entries(obj)[0];
        super(key, value.map(item => new JsField(item)));
    }
}
export class JsAttribute extends JsEmpty {
    constructor(obj) {
        const [key, value] = Object.entries(obj)[0];
        super(key);
        this.attributes = value;
    }
}
export class JsAttributes extends JsDir {
    constructor(obj) {
        const [key, value] = Object.entries(obj)[0];
        super(key, value.map(item => new JsAttribute(item)));
    }
}
export class JsFieldAttribute extends JsDir {
    constructor(obj) {
        const [key, value] = Object.entries(obj)[0];
        super(key, new Text(value));
        this.attributes = obj.attributes;
    }
}
class JsOutputArtNet extends JsAttribute {
    constructor(line = 1) {
        super({ Output: { Plugin: 'ArtNet', Line: line } })
    }
}
class JsInputMidi extends JsAttribute {
    constructor(line) {
        super({ Input: { Plugin: 'MIDI', Line: line } })
    }
}
class JsUniverse extends JsDir {
    constructor(props) {
        const midi = 'midi' in props ? [new JsInputMidi(props.midi)] : []
        super('Universe', midi.concat([new JsOutputArtNet()]));
        this.attributes = { Name: `Universe ${props.id + 1}`, ID: props.id };
    }
}
export class JsUniverses extends JsDir {
    constructor(obj) {
        const [key, value] = Object.entries(obj)[0];
        super(key, value.map(item => 'BeatType' in item ? new JsAttribute({ BeatGenerator: item }) : new JsUniverse(item)));
    }
}
class JsFixture extends JsDir {
    constructor(manufacturer, model, mode, id, name, universe, address, channels) {
        super(
            'Fixture',
            [
                { Manufacturer: manufacturer },
                { Model: model },
                { Mode: mode },
                { ID: id },
                { Name: name },
                { Universe: universe },
                { Address: address },
                { Channels: channels }
            ]
                .map(item => new JsField(item)));
    }
}
export class JsFixtureFromModel extends JsFixture {
    constructor(id, fixture = FixtureModels.GENERIC.genericRGB.grb, universe, address) {
        super(fixture.manufacturer, fixture.model, fixture.mode, id, `${fixture.manufacturer}${fixture.mode} ${id < 9 ? '0' : ''}${id}`, universe, address, fixture.addresses);
    }
}
export class JsGenericDRGB extends JsFixture {
    constructor(id, fixture = FixtureModels.GENERIC.genericRGB.dimmerRgb, universe, address) {
        super(fixture.manufacturer, fixture.model, fixture.mode, id, `${fixture.manufacturer}${fixture.mode} ${id < 9 ? '0' : ''}${id}`, universe, address, fixture.addresses);
    }
}
export class JsFunctionPlasmaRainbow extends JsDir {
    constructor(id = 0, fixtureGroupId = 0, duration = 10, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsFieldAttribute({ Algorithm: 'Plasma', attributes: { Type: 'Script' } }),
            new JsField({ MonoColor: 4294901760 }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId }),
            new JsAttribute({ Property: { Name: 'presetSize', Value: 5 } }),
            new JsAttribute({ Property: { Name: 'ramp', Value: 20 } }),
            new JsAttribute({ Property: { Name: 'stepsize', Value: 25 } })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}PlasmaRainbow${duration}ms` };
    }
}
export class JsFunctionAudioSpectrum extends JsDir {
    constructor(id, fixtureGroupId, duration = 5, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsAttribute({ Algorithm: { Type: 'Audio' } }),
            new JsField({ MonoColor: 4294901760 }),
            new JsField({ EndColor: 4278255360 }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}AudioSpectrum${duration}ms` };
    }
}
export class JsFunctionWaves extends JsDir {
    constructor(id, fixtureGroupId, monoColor, isLeft = false, duration = 5, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsFieldAttribute({ Algorithm: 'Waves', attributes: { Type: 'Script' } }),
            new JsField({ MonoColor: monoColor }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId }),
            new JsAttribute({ Property: { Name: 'direction', Value: isLeft ? 'Left' : 'Right' } }),
            new JsAttribute({ Property: { Name: 'orientation', Value: 'Vertical' } }),
            new JsAttribute({ Property: { Name: 'tailfade', Value: 'Yes' } }),
            new JsAttribute({ Property: { Name: 'taillength', Value: 50 } })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}Waves${duration}ms` };
    }
}
export class JsFunctionRandomSingle extends JsDir {
    constructor(id, fixtureGroupId, monoColor, duration = 10, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsFieldAttribute({ Algorithm: 'Random Single', attributes: { Type: 'Script' } }),
            new JsField({ MonoColor: monoColor }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}RandomSingle${duration}ms` };
    }
}
export class JsFunctionPlasmaColors extends JsDir {
    constructor(id = 0, fixtureGroupId = 0, duration = 200, color1Index = 'Green', color2Index = 'Seafoam', color3Index = 'Teal', color4Index = 'Purple', stepsize = 35, ramp = 30, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsFieldAttribute({ Algorithm: 'Plasma (Colors)', attributes: { Type: 'Script' } }),
            new JsField({ MonoColor: 4294901760 }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId }),
            new JsAttribute({ Property: { Name: 'color3Index', Value: color3Index } }),
            new JsAttribute({ Property: { Name: 'stepsize', Value: stepsize } }),
            new JsAttribute({ Property: { Name: 'presetSize', Value: 5 } }),
            new JsAttribute({ Property: { Name: 'color2Index', Value: color2Index } }),
            new JsAttribute({ Property: { Name: 'color5Index', Value: 'OFF' } }),
            new JsAttribute({ Property: { Name: 'ramp', Value: ramp } }),
            new JsAttribute({ Property: { Name: 'color4Index', Value: color4Index } }),
            new JsAttribute({ Property: { Name: 'color1Index', Value: color1Index } })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}PlasmaColors${duration}ms` };
    }
}
export class JsFunctionPlasmaGradient extends JsDir {
    constructor(id = 0, fixtureGroupId = 0, duration = 59, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsFieldAttribute({ Algorithm: 'Gradient', attributes: { Type: 'Script' } }),
            new JsField({ MonoColor: 4294901760 }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId }),
            new JsAttribute({ Property: { Name: 'orientation', Value: 'Vertical' } }),
            new JsAttribute({ Property: { Name: 'presetIndex', Value: 'Rainbow' } }),
            new JsAttribute({ Property: { Name: 'presetSize', Value: 5 } })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}PlasmaColor${duration}ms` };
    }
}
export class JsFunctionPlasmaPlain extends JsDir {
    constructor(id = 0, fixtureGroupId = 0, duration = 59, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsAttribute({ Algorithm: { Type: 'Plain' } }),
            new JsField({ MonoColor: 4278190080 }),
            new JsField({ ControlMode: FixtureMode.rgb }),
            new JsField({ FixtureGroup: fixtureGroupId }),
            new JsAttribute({ Property: { Name: 'stepsize', Value: 25 } }),
            new JsAttribute({ Property: { Name: 'presetSize', Value: 5 } }),
            new JsAttribute({ Property: { Name: 'ramp', Value: 15 } })
        ]);
        this.attributes = { ID: id, Type: 'RGBMatrix', Name: `${name}Group${id}PlasmaColor${duration}ms` };
    }
}
export class JsFunctionScene extends JsDir {
    constructor(id = 0, quantity = 1, duration = 0, name = "") {
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } })
        ].concat(new Array(quantity).fill({}).map(
            (_item, index) => new JsFieldAttribute({ FixtureVal: '0,0,1,0,2,0', attributes: { ID: index } })
        )));
        this.attributes = { ID: id, Type: 'Scene', Name: `${name}Group${id}Scene${duration}ms`, Hidden: 'True' };
    }
}
export class JsFunctionSequence extends JsDir {
    constructor(id = 1, quantity = 1, duration = 50, boundScene = 0, name = "") {
        let value = '';
        super('Function', [
            new JsAttribute({ Speed: { FadeIn: 0, FadeOut: 0, Duration: duration } }),
            new JsField({ Direction: 'Forward' }),
            new JsField({ RunOrder: 'Loop' }),
            new JsAttribute({ SpeedModes: { FadeIn: 'Default', FadeOut: 'Default', Duration: 'PerStep' } })
        ].concat(new Array(quantity).fill({}).map(
            (_item, index, array) => {
                value += `${index > 0 ? ':' : ''}${index}:0,255,1,255,2,255`
                return new JsFieldAttribute({ Step: value, attributes: { Number: index, FadeIn: 0, Hold: index < array.length - 1 ? 50 : 99999999, FadeOut: 0, Values: 360 } })
            }
        )));
        this.attributes = { ID: id, Type: 'Sequence', Name: `${name}Group${id}Sequence${duration}ms`, BoundScene: boundScene };
    }
}
export class JsSliderPlayback extends JsDir {
    constructor(id = 0, name = 'Group0PlasmaRainbow', fixtureGroupId = 0, backgroundColor = 'Default', x = 75, y = 55, midi = 128) {
        super('Slider', [
            new JsAttribute({ WindowState: { Visible: "True", X: x, Y: y, Width: 60, Height: 200 } }),
            new JsDir('Appearance', [
                new JsField({ FrameStyle: 'Sunken' }),
                new JsField({ ForegroundColor: 'Default' }),
                new JsField({ BackgroundColor: backgroundColor }),
                new JsField({ BackgroundImage: 'None' }),
                new JsField({ Font: 'Default' })
            ]),
            new JsAttribute({ Input: { Universe: 0, Channel: midi } }),
            new JsFieldAttribute({ SliderMode: 'Playback', attributes: { ValueDisplayStyle: 'Exact', ClickAndGoType: 'None' } }),
            new JsAttribute({ Level: { LowLimit: 0, HighLimit: 255, Value: 0 } }),
            new JsDir('Playback', new JsField({ Function: fixtureGroupId }))
        ]);
        this.attributes = { Caption: name, ID: id, WidgetStyle: 'Slider', InvertedAppearance: false };
    }
}
export class JsSliderLevel extends JsDir {
    constructor(id = 0, name = `Group${fixtureGroupId}DimmerRGB`, backgroundColor = 'Default', x = 75, y = 55, value = 255, channel = 1, fixtures = [0], midi) {
        super('Slider', [
            new JsAttribute({ WindowState: { Visible: "True", X: x, Y: y, Width: 60, Height: 200 } }),
            new JsDir('Appearance', [
                new JsField({ FrameStyle: 'Sunken' }),
                new JsField({ ForegroundColor: 'Default' }),
                new JsField({ BackgroundColor: backgroundColor }),
                new JsField({ BackgroundImage: 'None' }),
                new JsField({ Font: 'Default' })
            ])].concat(midi ? [new JsAttribute({ Input: { Universe: 0, Channel: midi } })] : [])
            .concat([
                new JsFieldAttribute({ SliderMode: 'Level', attributes: { ValueDisplayStyle: 'Exact', ClickAndGoType: 'None', Monitor: false } }),
                {
                    ...new JsAttribute({ Level: { LowLimit: 0, HighLimit: 255, Value: value } }),
                    elements: fixtures.map(fixture => new JsFieldAttribute({ Channel: channel, attributes: { Fixture: fixture } }))
                },
                new JsDir('Playback', new JsField({ Function: 4294967295 }))
            ])
        );
        this.attributes = { Caption: name, ID: id, WidgetStyle: 'Slider', InvertedAppearance: false };
    }
}
export class JsSliderSubmaster extends JsDir {
    constructor(id = 0, name = `SliderSubmaster${id}`, backgroundColor = 'Default', x = 75, y = 55, value = 22, midi) {
        super('Slider', [
            new JsAttribute({ WindowState: { Visible: "True", X: x, Y: y, Width: 60, Height: 200 } }),
            new JsDir('Appearance', [
                new JsField({ FrameStyle: 'Sunken' }),
                new JsField({ ForegroundColor: 'Default' }),
                new JsField({ BackgroundColor: backgroundColor }),
                new JsField({ BackgroundImage: 'None' }),
                new JsField({ Font: 'Default' })
            ]),

        ].concat(midi ? [new JsAttribute({ Input: { Universe: 0, Channel: midi } })] : [])
            .concat([
                new JsFieldAttribute({ SliderMode: 'Submaster', attributes: { ValueDisplayStyle: 'Exact', ClickAndGoType: 'None' } }),
                new JsAttribute({ Level: { LowLimit: 0, HighLimit: 255, Value: value } }),
                new JsDir('Playback', new JsField({ Function: 4294967295 }))
            ])
        );
        this.attributes = { Caption: name, ID: id, WidgetStyle: 'Slider', InvertedAppearance: false };
    }
}
export class JsSpeedDial extends JsDir {
    constructor(id = 0, name = 'Group0PlasmaRainbow', fixtureGroupId = 0, backgroundColor = 'Default', x = 150, y = 55, min = 1, max = 100, duration = 500, midi = 129) {
        super('SpeedDial', [
            new JsAttribute({ WindowState: { Visible: "True", X: x, Y: y, Width: 210, Height: 200 } }),
            new JsDir('Appearance', [
                new JsField({ FrameStyle: 'Sunken' }),
                new JsField({ ForegroundColor: 'Default' }),
                new JsField({ BackgroundColor: backgroundColor }),
                new JsField({ BackgroundImage: 'None' }),
                new JsField({ Font: 'Default' })
            ]),
            new JsField({ Visibility: 127 }),
            { ...new JsDir('AbsoluteValue', new JsAttribute({ Input: { Universe: 0, Channel: midi } })), attributes: { Minimum: min, Maximum: max } },
            new JsField({ Time: duration }),
            new JsFieldAttribute({ Function: fixtureGroupId, attributes: { FadeIn: 0, FadeOut: 0, Duration: 6 } })
        ]);
        this.attributes = { Caption: name, ID: id };
    }
}

export class JsLabel extends JsDir {
    constructor(id, name, backgroundColor = 'Default', y) {
        super('Label', [
            new JsAttribute({ WindowState: { Visible: "True", X: 10, Y: y, Width: 50, Height: 200 } }),
            new JsDir('Appearance', [
                new JsField({ FrameStyle: 'None' }),
                new JsField({ ForegroundColor: 'Default' }),
                new JsField({ BackgroundColor: backgroundColor }),
                new JsField({ BackgroundImage: 'None' }),
                new JsField({ Font: 'Default' })
            ]),
        ]);
        this.attributes = { Caption: name, ID: id };
    }
}

export class JsButton extends JsDir {
    constructor(id = 0, name = 'Group0PlasmaRainbow', fixtureGroupId = 0, x = 20, y = 60, intensityValue = 100, intensityAdjust = 'False', midi = 128) {
        super('Button', [
            new JsAttribute({ WindowState: { Visible: "True", X: x, Y: y, Width: 50, Height: 50 } }),
            new JsDir('Appearance', [
                new JsField({ FrameStyle: 'None' }),
                new JsField({ ForegroundColor: 'Default' }),
                new JsField({ BackgroundColor: 'Default' }),
                new JsField({ BackgroundImage: 'None' }),
                new JsField({ Font: 'Default' })
            ]),
            new JsAttribute({ Function: { ID: fixtureGroupId } }),
            new JsField({ Action: 'Toggle' }),
            new JsFieldAttribute({ Intensity: intensityValue, attributes: { Adjust: intensityAdjust } }),
            new JsAttribute({ Input: { Universe: 0, Channel: midi } })
        ]);
        this.attributes = { Caption: name, ID: id, Icon: '' };
    }
}