import { PureComponent } from 'react';
import PropTypes from 'prop-types';
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

const TabContainer = styled.div`
    display: flex;
    border-bottom: 1px solid #ccc;
    margin-bottom: 10px;
`;

const Tab = styled.div`
    padding: 5px 10px;
    cursor: pointer;
    font-size: 12px;
    border: 1px solid transparent;
    border-bottom: none;
    margin-bottom: -1px;
    background: ${props => props.$active ? '#fff' : 'transparent'};
    border-color: ${props => props.$active ? '#ccc #ccc transparent #ccc' : 'transparent'};
    font-weight: ${props => props.$active ? 'bold' : 'normal'};
`;

const LayoutItem = styled.div`
    display: flex;
    align-items: center;
    padding: 5px;
    border: 1px solid #eee;
    margin-bottom: 5px;
    font-size: 11px;
    gap: 5px;
`;

const LayoutControls = styled.div`
    display: flex;
    gap: 2px;
    margin-left: auto;
`;

const IconButton = styled.button`
    padding: 2px 4px;
    font-size: 10px;
    cursor: pointer;
`;

const WIDGETS = [
    { id: 'visualizer', name: 'Visualizer' },
    { id: 'connection', name: 'Connection' },
    { id: 'console', name: 'Console' },
    { id: 'grbl', name: 'Grbl' },
    { id: 'autolevel', name: 'Autolevel' },
    { id: 'axes', name: 'Axes' },
    { id: 'custom', name: 'Custom' },
    { id: 'gcode', name: 'G-code' },
    { id: 'laser', name: 'Laser' },
    { id: 'macro', name: 'Macro' },
    { id: 'marlin', name: 'Marlin' },
    { id: 'probe', name: 'Probe' },
    { id: 'smoothie', name: 'Smoothie' },
    { id: 'spindle', name: 'Spindle' },
    { id: 'tinyg', name: 'TinyG' },
    { id: 'tool', name: 'Tool' },
    { id: 'webcam', name: 'Webcam' }
];

const getLayout = () => WIDGETS.map((w, index) => ({
    id: w.id,
    visible: true,
    side: index < 7 ? 'left' : 'right'
}));

const getDefaultSettings = () => ({
    spindel: {
        $30: 24000,
        $110: 2000,
        $111: 2000,
        $120: 100,
        $121: 100,
        layout: getLayout()
    },
    laser: {
        $30: 1000,
        $110: 5000,
        $111: 5000,
        $120: 500,
        $121: 500,
        layout: getLayout()
    },
    gpioPin: 16,
    bridgeUrl: `http://${window.location.hostname}:8008`
});

class App extends PureComponent {
    static propTypes = {
        token: PropTypes.string,
        host: PropTypes.string
    };

    state = {
        applyingLayout: false,
        port: controller.port,
        controller: {
            type: controller.type,
            state: controller.state
        },
        currentMode: localStorage.getItem('CNCjs_SpindelLaser_Switch_CurrentMode') || 'Spindel',
        showSettings: false,
        settings: this.loadSettings(),
        activeTab: 'general'
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
        // Delay to allow CNCjs to initialize
        setTimeout(() => {
            this.applyLayout(this.state.currentMode);
        }, 1000);
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
        const defaultSettings = getDefaultSettings();
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                const merged = { ...defaultSettings, ...settings };
                ['spindel', 'laser'].forEach(mode => {
                    // Create a clean layout from current WIDGETS
                    const defaultLayout = getLayout();
                    if (settings[mode] && settings[mode].layout) {
                        // Use saved settings for widgets that still exist
                        merged[mode].layout = defaultLayout.map(dw => {
                            const sw = settings[mode].layout.find(item => item.id === dw.id);
                            return sw ? { ...dw, ...sw } : dw;
                        });
                    } else {
                        merged[mode].layout = defaultLayout;
                    }
                });
                return merged;
            } catch (err) {
                console.error(err);
                return defaultSettings;
            }
        }
        return defaultSettings;
    }

    saveSettings(settings) {
        localStorage.setItem('CNCjs_SpindelLaser_Switch_Settings', JSON.stringify(settings));
    }

    handleSettingChange = (mode, key, value) => {
        const defaultSettings = getDefaultSettings();
        let processedValue = value;
        if (typeof defaultSettings[key] === 'number' || (mode && typeof defaultSettings[mode][key] === 'number')) {
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

    handleLayoutChange = (mode, layout) => {
        this.setState(prevState => {
            const newSettings = {
                ...prevState.settings,
                [mode]: {
                    ...prevState.settings[mode],
                    layout: layout
                }
            };
            this.saveSettings(newSettings);
            return { settings: newSettings };
        }, () => {
            this.applyLayout(mode);
        });
    };

    moveLayoutItem = (mode, index, direction) => {
        const { settings } = this.state;
        const layout = [...settings[mode].layout];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= layout.length) return;

        const item = layout.splice(index, 1)[0];
        layout.splice(newIndex, 0, item);
        this.handleLayoutChange(mode, layout);
    };

    toggleLayoutVisibility = (mode, index) => {
        const { settings } = this.state;
        const layout = [...settings[mode].layout];
        layout[index] = { ...layout[index], visible: !layout[index].visible };
        this.handleLayoutChange(mode, layout);
    };

    toggleLayoutSide = (mode, index) => {
        const { settings } = this.state;
        const layout = [...settings[mode].layout];
        layout[index] = { ...layout[index], side: layout[index].side === 'left' ? 'right' : 'left' };
        this.handleLayoutChange(mode, layout);
    };

    sendGrblCommands = (commands) => {
        commands.forEach(cmd => {
            console.log('Sending command to Grbl:', cmd);
            // controller.command automatically prepends the active connection identifier (port)
            controller.command('gcode', cmd);
        });
    };

    updateGpio = (state) => {
        const { settings } = this.state;
        const val = state === 'high' ? 'on' : 'off';
        const url = `${settings.bridgeUrl}/?pin=${settings.gpioPin}&state=${val}`;

        console.log(`GPIO Bridge: Fetching ${url}`);
        fetch(url).catch(err => console.error('Bridge request failed:', err));
    };

    applyLayout = (mode) => {
        const { settings } = this.state;
        const { token } = this.props;
        const layout = settings[mode.toLowerCase()].layout;

        if (!layout) {
            console.log('Skipping applyLayout: missing layout');
            return;
        }

        console.log(`[Debug] Applying layout for ${mode}:`, layout);
        this.setState({ applyingLayout: true });

        // We use the controller's socket to get and set the configuration
        // because the REST API and postMessage failed in the user's environment.
        if (controller.socket) {
            console.log('[Debug] Socket connection found, requesting config');

            // Note: CNCjs socket events for config are usually 'config:get' and 'config:set'
            controller.socket.emit('config:get', (config) => {
                console.log('[Debug] Received config via socket:', JSON.stringify(config, null, 2));

                try {
                    // Update workspace layout
                    const primary = []; // Left side
                    const secondary = []; // Right side
                    const defaultContainer = get(config, 'state.workspace.container.default.widgets', []);

                    layout.forEach(item => {
                        if (!item.visible) return;
                        if (item.side === 'left') {
                            primary.push(item.id);
                        } else {
                            secondary.push(item.id);
                        }
                    });

                    // Ensure widgets are only in ONE container. Remove from 'default' if present in others
                    const allAssigned = [...primary, ...secondary];
                    const filteredDefault = defaultContainer.filter(id => !allAssigned.includes(id));

                    // Safety: Ensure 'custom' widget (this widget) is always present
                    if (!primary.includes('custom') && !secondary.includes('custom')) {
                        secondary.push('custom');
                    }

                    console.log('[Debug] New Primary (Left):', primary);
                    console.log('[Debug] New Secondary (Right):', secondary);

                    if (config && config.state && config.state.workspace && config.state.workspace.container) {
                        config.state.workspace.container.primary.widgets = primary;
                        config.state.workspace.container.secondary.widgets = secondary;
                        config.state.workspace.container.default.widgets = filteredDefault;

                        console.log('[Debug] Emitting config:set via socket');
                        controller.socket.emit('config:set', config, (err) => {
                            if (err) {
                                console.error('[Debug] Error from config:set ack:', err);
                            } else {
                                console.log('[Debug] Config:set ack received (success)');
                            }
                        });
                    } else {
                        console.error('[Debug] Invalid config structure received via socket');
                    }
                } catch (err) {
                    console.error('[Debug] Error processing socket config:', err);
                }
            });
        } else {
            console.warn('[Debug] No socket connection available for persistent layout update');
        }

        // We still send postMessage as a backup for immediate (but potentially non-persistent) UI changes
        layout.forEach((item, index) => {
            setTimeout(() => {
                window.parent.postMessage({
                    token: token,
                    action: {
                        type: 'widget:visibility',
                        payload: { id: item.id, widget: item.id, visible: item.visible }
                    }
                }, '*');

                // Try format 2: explicit show/hide
                window.parent.postMessage({
                    token: token,
                    action: item.visible ? 'widget:show' : 'widget:hide',
                    payload: { id: item.id, widget: item.id }
                }, '*');
            }, index * 50);
        });

        setTimeout(() => {
            this.setState({ applyingLayout: false });
        }, 2000);
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
        this.applyLayout('Laser');
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
        this.applyLayout('Spindel');
        this.setState({ currentMode: 'Spindel' });
        localStorage.setItem('CNCjs_SpindelLaser_Switch_CurrentMode', 'Spindel');
    };

    canSwitch = () => {
        const { port, controller: { type, state } } = this.state;
        if (!port || type !== GRBL) return false;

        const activeState = get(state, 'status.activeState');
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    };

    renderLayoutTab(mode) {
        const { settings, applyingLayout } = this.state;
        const layout = settings[mode].layout || getLayout();

        return (
            <div>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '11px', color: '#666' }}>Configure {mode} Layout</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <IconButton onClick={() => window.parent.location.reload()}>🔄 Reload CNCjs</IconButton>
                        <IconButton disabled={applyingLayout} onClick={() => this.applyLayout(mode)}>
                            {applyingLayout ? 'Applying...' : 'Apply Layout Now'}
                        </IconButton>
                    </div>
                </div>
                {layout.map((item, index) => {
                    const widgetInfo = WIDGETS.find(w => w.id === item.id) || { name: item.id };
                    return (
                        <LayoutItem key={item.id}>
                            <div style={{ width: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{widgetInfo.name}</div>
                            <LayoutControls>
                                <IconButton onClick={() => this.toggleLayoutVisibility(mode, index)}>
                                    {item.visible ? '👁️' : '🚫'}
                                </IconButton>
                                <IconButton onClick={() => this.toggleLayoutSide(mode, index)}>
                                    {item.side === 'left' ? 'L' : 'R'}
                                </IconButton>
                                <IconButton disabled={index === 0} onClick={() => this.moveLayoutItem(mode, index, -1)}>
                                    ↑
                                </IconButton>
                                <IconButton disabled={index === layout.length - 1} onClick={() => this.moveLayoutItem(mode, index, 1)}>
                                    ↓
                                </IconButton>
                            </LayoutControls>
                        </LayoutItem>
                    );
                })}
            </div>
        );
    }

    render() {
        const { port, controller: { type, state }, currentMode, showSettings, settings, activeTab } = this.state;
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
                            <TabContainer>
                                <Tab $active={activeTab === 'general'} onClick={() => this.setState({ activeTab: 'general' })}>General</Tab>
                                <Tab $active={activeTab === 'spindel'} onClick={() => this.setState({ activeTab: 'spindel' })}>Spindel</Tab>
                                <Tab $active={activeTab === 'laser'} onClick={() => this.setState({ activeTab: 'laser' })}>Laser</Tab>
                            </TabContainer>

                            {activeTab === 'general' && (
                                <div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <Label>Bridge URL</Label>
                                        <Input type="text" value={settings.bridgeUrl} onChange={e => this.handleSettingChange(null, 'bridgeUrl', e.target.value)} />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <Label>GPIO Pin</Label>
                                        <Input type="number" value={settings.gpioPin} onChange={e => this.handleSettingChange(null, 'gpioPin', e.target.value)} />
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <TestButton onClick={() => this.updateGpio('high')}>Test High</TestButton>
                                            <TestButton onClick={() => this.updateGpio('low')}>Test Low</TestButton>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'spindel' && (
                                <div>
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
                                    {this.renderLayoutTab('spindel')}
                                </div>
                            )}

                            {activeTab === 'laser' && (
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>Laser Settings</div>
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
                                    {this.renderLayoutTab('laser')}
                                </div>
                            )}
                        </div>
                    )}
                </SettingsSection>
            </Container>
        );
    }
}

export default App;
