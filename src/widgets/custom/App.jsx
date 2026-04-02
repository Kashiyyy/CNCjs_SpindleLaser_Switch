import React, { PureComponent } from 'react';
import styled from 'styled-components';
import get from 'lodash.get';
import controller from '../../lib/controller';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE
} from '../../constants';

const Container = styled.div`
    padding: 10px;
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-top: 10px;
`;

const Button = styled.button`
    flex: 1;
    padding: 10px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: ${props => props.$active ? '#007bff' : '#f8f9fa'};
    color: ${props => props.$active ? '#fff' : '#333'};
    opacity: ${props => props.disabled ? 0.5 : 1};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

    &:hover:not(:disabled) {
        background-color: ${props => props.$active ? '#0056b3' : '#e2e6ea'};
    }
`;

const TestButton = styled(Button)`
    padding: 5px;
    font-size: 12px;
    margin-top: 5px;
`;

const StatusText = styled.div`
    margin-bottom: 10px;
    font-size: 14px;
    color: #555;
`;

const ModeIndicator = styled.span`
    font-weight: bold;
    color: ${props => props.$mode === 'Laser' ? '#d9534f' : '#5bc0de'};
`;

const SettingsSection = styled.div`
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #eee;
`;

const SettingsTitle = styled.div`
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #333;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
    font-size: 12px;
    margin-bottom: 10px;
`;

const Input = styled.input`
    width: 100%;
    padding: 2px 5px;
    border: 1px solid #ccc;
    border-radius: 3px;
`;

const Label = styled.label`
    display: block;
    margin-bottom: 2px;
    color: #666;
`;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #333;
    margin-bottom: 10px;
    cursor: pointer;
`;

const DEFAULT_SETTINGS = {
    spindel: {
        $30: 24000,
        $110: 2000,
        $111: 2000,
        $120: 100,
        $121: 100
    },
    laser: {
        $30: 1000,
        $110: 5000,
        $111: 5000,
        $120: 500,
        $121: 500
    },
    gpioPin: 16,
    directControl: true,
    bridgeUrl: 'http://localhost:8008',
    commandOn: 'laser-on',
    commandOff: 'laser-off'
};

class App extends PureComponent {
    state = {
        port: controller.port,
        controller: {
            type: controller.type,
            state: controller.state
        },
        currentMode: localStorage.getItem('CNCjs_SpindelLaser_Switch_CurrentMode') || 'Spindel',
        showSettings: false,
        settings: this.loadSettings()
    };

    controllerEvent = {
        'serialport:open': (options) => {
            const { port } = options;
            this.setState({ port: port });
        },
        'serialport:close': (options) => {
            this.setState({ port: '', controller: { type: '', state: {} } });
        },
        'controller:state': (controllerType, controllerState) => {
            this.setState(state => ({
                controller: {
                    ...state.controller,
                    type: controllerType,
                    state: controllerState
                }
            }));
        }
    };

    componentDidMount() {
        this.addControllerEvents();
    }

    componentWillUnmount() {
        this.removeControllerEvents();
    }

    addControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.addListener(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvent).forEach(eventName => {
            const callback = this.controllerEvent[eventName];
            controller.removeListener(eventName, callback);
        });
    }

    loadSettings() {
        const saved = localStorage.getItem('CNCjs_SpindelLaser_Switch_Settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                return { ...DEFAULT_SETTINGS, ...settings };
            } catch (e) {
                return DEFAULT_SETTINGS;
            }
        }
        return DEFAULT_SETTINGS;
    }

    saveSettings(settings) {
        localStorage.setItem('CNCjs_SpindelLaser_Switch_Settings', JSON.stringify(settings));
    }

    handleSettingChange = (mode, key, value) => {
        let processedValue = value;
        if (key === 'directControl') {
            processedValue = value; // boolean
        } else if (typeof DEFAULT_SETTINGS[key] === 'number' || (mode && typeof DEFAULT_SETTINGS[mode][key] === 'number')) {
            processedValue = Number(value);
        }

        this.setState(prevState => {
            let newSettings;
            if (mode) {
                newSettings = {
                    ...prevState.settings,
                    [mode]: {
                        ...prevState.settings[mode],
                        [key]: processedValue
                    }
                };
            } else {
                newSettings = {
                    ...prevState.settings,
                    [key]: processedValue
                };
            }
            this.saveSettings(newSettings);
            return { settings: newSettings };
        });
    };

    sendGrblCommands = (commands) => {
        commands.forEach(cmd => {
            console.log('Sending command to Grbl:', cmd);
            controller.command('gcode', cmd);
        });
    };

    updateGpio = (state) => {
        const { settings } = this.state;
        const val = state === 'high' ? 'on' : 'off';

        if (settings.directControl) {
            const url = `${settings.bridgeUrl}/?pin=${settings.gpioPin}&state=${val}`;
            console.log(`Direct Control: Fetching ${url}`);
            fetch(url).catch(err => console.error('Bridge request failed:', err));
        } else {
            const commandName = state === 'high' ? settings.commandOn : settings.commandOff;
            console.log(`CNCjs Command: Triggering ${commandName}`);
            if (controller.socket) {
                controller.socket.emit('run', commandName);
                if (this.state.port) {
                    controller.socket.emit('command', this.state.port, 'run', commandName);
                }
            }
        }
    };

    switchToLaser = () => {
        if (!this.canSwitch()) return;
        const { settings } = this.state;
        const s = settings.laser;

        const commands = [
            '$32=1',
            `$30=${s.$30}`,
            `$110=${s.$110}`,
            `$111=${s.$111}`,
            `$120=${s.$120}`,
            `$121=${s.$121}`
        ];

        this.sendGrblCommands(commands);
        this.updateGpio('high');
        this.setState({ currentMode: 'Laser' });
        localStorage.setItem('CNCjs_SpindelLaser_Switch_CurrentMode', 'Laser');
    };

    switchToSpindel = () => {
        if (!this.canSwitch()) return;
        const { settings } = this.state;
        const s = settings.spindel;

        const commands = [
            '$32=0',
            `$30=${s.$30}`,
            `$110=${s.$110}`,
            `$111=${s.$111}`,
            `$120=${s.$120}`,
            `$121=${s.$121}`
        ];

        this.sendGrblCommands(commands);
        this.updateGpio('low');
        this.setState({ currentMode: 'Spindel' });
        localStorage.setItem('CNCjs_SpindelLaser_Switch_CurrentMode', 'Spindel');
    };

    canSwitch = () => {
        const { port, controller: { type, state } } = this.state;
        if (!port || type !== GRBL) return false;

        const activeState = get(state, 'status.activeState');
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    };

    render() {
        const { port, controller: { type, state }, currentMode, showSettings, settings } = this.state;
        const activeState = get(state, 'status.activeState');
        const isIdle = activeState === GRBL_ACTIVE_STATE_IDLE;
        const isGrbl = type === GRBL;
        const canSwitch = port && isGrbl && isIdle;

        if (!port) {
            return (
                <Container style={{ color: '#333', opacity: '.65' }}>
                    No serial connection
                </Container>
            );
        }

        if (!isGrbl) {
            return (
                <Container style={{ color: '#d9534f' }}>
                    Only Grbl controller is supported.
                </Container>
            );
        }

        return (
            <Container>
                <StatusText>
                    Status: <strong>{activeState || 'Unknown'}</strong>
                </StatusText>
                <StatusText>
                    Current Mode: <ModeIndicator $mode={currentMode}>{currentMode}</ModeIndicator>
                </StatusText>
                {!isIdle && (
                    <StatusText style={{ color: '#d9534f', fontSize: '12px' }}>
                        * Switching only allowed in Idle state.
                    </StatusText>
                )}
                <ButtonGroup>
                    <Button
                        $active={currentMode === 'Spindel'}
                        disabled={!canSwitch}
                        onClick={this.switchToSpindel}
                    >
                        Spindel Mode
                    </Button>
                    <Button
                        $active={currentMode === 'Laser'}
                        disabled={!canSwitch}
                        onClick={this.switchToLaser}
                    >
                        Laser Mode
                    </Button>
                </ButtonGroup>

                <SettingsSection>
                    <SettingsTitle onClick={() => this.setState({ showSettings: !showSettings })}>
                        <span>Settings {showSettings ? '▲' : '▼'}</span>
                    </SettingsTitle>
                    {showSettings && (
                        <div>
                            <CheckboxLabel>
                                <input
                                    type="checkbox"
                                    checked={settings.directControl}
                                    onChange={e => this.handleSettingChange(null, 'directControl', e.target.checked)}
                                />
                                Direkte Steuerung (über GPIO Bridge)
                            </CheckboxLabel>

                            {settings.directControl ? (
                                <div style={{ marginBottom: '10px' }}>
                                    <Label>Bridge URL</Label>
                                    <Input type="text" value={settings.bridgeUrl} onChange={e => this.handleSettingChange(null, 'bridgeUrl', e.target.value)} />
                                </div>
                            ) : (
                                <Grid>
                                    <div>
                                        <Label>CMD High</Label>
                                        <Input type="text" value={settings.commandOn} onChange={e => this.handleSettingChange(null, 'commandOn', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>CMD Low</Label>
                                        <Input type="text" value={settings.commandOff} onChange={e => this.handleSettingChange(null, 'commandOff', e.target.value)} />
                                    </div>
                                </Grid>
                            )}

                            <div style={{ marginBottom: '10px' }}>
                                <Label>GPIO Pin</Label>
                                <Input type="number" value={settings.gpioPin} onChange={e => this.handleSettingChange(null, 'gpioPin', e.target.value)} />
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <TestButton onClick={() => this.updateGpio('high')}>Test High</TestButton>
                                    <TestButton onClick={() => this.updateGpio('low')}>Test Low</TestButton>
                                </div>
                            </div>

                            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>Spindel Settings</div>
                            <Grid>
                                <div>
                                    <Label>$30 (Max S)</Label>
                                    <Input type="number" value={settings.spindel.$30} onChange={e => this.handleSettingChange('spindel', '$30', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$110 (X Rate)</Label>
                                    <Input type="number" value={settings.spindel.$110} onChange={e => this.handleSettingChange('spindel', '$110', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$111 (Y Rate)</Label>
                                    <Input type="number" value={settings.spindel.$111} onChange={e => this.handleSettingChange('spindel', '$111', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$120 (X Accel)</Label>
                                    <Input type="number" value={settings.spindel.$120} onChange={e => this.handleSettingChange('spindel', '$120', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$121 (Y Accel)</Label>
                                    <Input type="number" value={settings.spindel.$121} onChange={e => this.handleSettingChange('spindel', '$121', e.target.value)} />
                                </div>
                            </Grid>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px', marginTop: '10px' }}>Laser Settings</div>
                            <Grid>
                                <div>
                                    <Label>$30 (Max S)</Label>
                                    <Input type="number" value={settings.laser.$30} onChange={e => this.handleSettingChange('laser', '$30', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$110 (X Rate)</Label>
                                    <Input type="number" value={settings.laser.$110} onChange={e => this.handleSettingChange('laser', '$110', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$111 (Y Rate)</Label>
                                    <Input type="number" value={settings.laser.$111} onChange={e => this.handleSettingChange('laser', '$111', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$120 (X Accel)</Label>
                                    <Input type="number" value={settings.laser.$120} onChange={e => this.handleSettingChange('laser', '$120', e.target.value)} />
                                </div>
                                <div>
                                    <Label>$121 (Y Accel)</Label>
                                    <Input type="number" value={settings.laser.$121} onChange={e => this.handleSettingChange('laser', '$121', e.target.value)} />
                                </div>
                            </Grid>
                        </div>
                    )}
                </SettingsSection>
            </Container>
        );
    }
}

export default App;
