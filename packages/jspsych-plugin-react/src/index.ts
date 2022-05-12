import {
  JsPsych,
  JsPsychPlugin,
  ParameterType,
  TrialType
} from "jspsych";


const info = <const>{
  name: "React",
  parameters: {
    handlesSubmit: {
      pretty_name: "Component provides the Submit Button",
      type: ParameterType.BOOL,
      default: true,
    }
  }
}
type ReactInfo = typeof info;


class ReactPlugin implements JsPsychPlugin<ReactInfo> {
  static info: ReactInfo = info;

  constructor(private readonly jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(container: HTMLElement, trial: TrialType<ReactInfo>, on_load: () => void) {
    on_load();

    if (!trial.handlesSubmit) {
      let nextBtn: HTMLElement = <HTMLElement>document.getElementById("next");

      nextBtn.addEventListener("click", () => {
        this.jsPsych.pluginAPI.clearAllTimeouts();
        this.jsPsych.finishTrial();
      });
    }
  }
}

export default ReactPlugin;
