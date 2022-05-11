import { JsPsych, JsPsychExtension, JsPsychExtensionInfo } from "jspsych";
import _ from "lodash"

interface InitializeParameters {
  environment: "jatos" | "production" | "development"
  jatos: any,
  callback?: (jatos: any) => void
}

interface OnStartParameters {
}

interface OnLoadParameters {
}

interface OnFinishParameters {
  retrieve: string[],
}

type TrialSupportData = {
  [key: string]: string | undefined
}

type URLVars = {
  prolificID: string | number,
  sessionID: string | number,
  studyID: string | number,
}

/**
 * **JATOS Extension**
 *
 * Extract relevant data from jsPsych elements to store online.
 *
 * @author John Muchovej
 * @see {@link https://john.muchovej.com/projects/jspsych-extension-jatos/}
 */
class JATOSExtension implements JsPsychExtension {
  static info: JsPsychExtensionInfo = {
    name: "jatos",
  };

  private prolificID: URLVars["prolificID"] = -1
  private studyID: URLVars["studyID"] = -1
  private sessionID: URLVars["sessionID"] = -1
  private supportData: TrialSupportData = {}

  private jatos!: any;
  private environment!: string;
  private redirectURL!: string;

  constructor(private readonly jsPsych: JsPsych) {
    this.jsPsych = jsPsych
  }

  initialize(
    {environment, callback = (jatos) => {} }: InitializeParameters
  ): Promise<void> {
    this.environment = environment

    if (this.onJATOS) {
      this.prolificID = _.get(this.jatos, "urlQueryParameters.PROLIFIC_ID", -1)
      this.studyID = _.get(this.jatos, "urlQueryParameters.STUDY_ID", -1)
      this.sessionID = _.get(this.jatos, "urlQueryParameters.SESSION_ID", -1)
      this.redirectURL = this.jatos.batchJsonInput.redirectURL
    }

    this.jsPsych.data.addProperties(this.urlVars)

    this.addAbortButton(callback)

    return new Promise(async (resolve, reject) => {
      if (this.onJATOS)
        await this.jatos.submitResultData(this.urlVars)

      resolve();
    });
  };

  on_start({}: OnStartParameters): void {
    if (!this.onJATOS)
      return

  };

  on_load({}: OnLoadParameters): void {
    if (!this.onJATOS)
      return
  };

  on_finish({retrieve}: OnFinishParameters): { [key: string]: any } {
    const {current_trial_global: trial_index} = this.jsPsych.getProgress()
    const trial_data = this.jsPsych.data.get().filter({trial_index}).values()[0]

    for (const key of retrieve) {
      this.supportData[key.split(".").slice(-1)[0]] = _.get(trial_data, key)
    }

    console.log(this.supportData)

    return {}
  };

  get urlVars(): URLVars {
    if (_.keys(this.supportData).includes("prolificID") && this.prolificID == -1) {
      this.prolificID = <string>this.supportData["prolificID"]
    }

    return {
      prolificID: this.prolificID,
      studyID: this.studyID,
      sessionID: this.sessionID,
    }
  }

  get onJATOS(): boolean {
    if (this.environment !== "jatos") {
      console.warn("Not on JATOS. Simulating 'success'.")
      return false
    }
    // @ts-expect-error
    while (this.environment === "jatos" && typeof jatos === "undefined") {
      setTimeout(() => {}, 250)
    }
    // Since JATOS is provided globally, we need to wait on it to be loaded
    //   before proceeding with the experiment
    // @ts-expect-error
    this.jatos = jatos
    return true
  }

  get filename(): string {
    return `prolificID=${this.prolificID}-studyID=${this.studyID}`
  }

  async uploadJSON(): Promise<any> {
    const JSON = this.jsPsych.data.get().json()
    return new Promise<any>(async (resolve, reject) => {
      if (!this.onJATOS) {
        console.warn("Not on JATOS. Simulating 'success'.")
        resolve(JSON)
      }

      try {
        await this.jatos.uploadResultFile(JSON, `${this.filename}.json`)
        resolve(JSON)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * **uploadCSV** is a wrapper to both _transform_ your jsPsych data into a CSV
   * format **and** upload the results to JATOS (if present).
   *
   * @param toCSV A function that will perform whatever filtering is necessary
   *              and call `data.values()` to retrieve the list to be iterated
   *              over.
   */
  async uploadCSV(toCSV: Function): Promise<any> {
    const CSV = toCSV(this.jsPsych.data.get(), this.urlVars)
    return new Promise<any>(async (resolve, reject) => {
      if (!this.onJATOS) {
        console.warn("Not on JATOS. Simulating 'success'.")
        resolve(CSV)
      }

      try {
        await this.jatos.uploadResultFile(CSV, `${this.filename}.csv`)
        resolve(CSV)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   *
   */
  async uploadResultData(): Promise<any> {
    const resultData = {
      ...this.urlVars, totalTime: this.jsPsych.getTotalTime(),
      supportData: this.supportData, data: this.jsPsych.data.get().json(),
      jatos: {}
    }

    return new Promise<any>(async (resolve, reject) => {
      if (!this.onJATOS) {
        resolve(resultData)
      }

      resultData.jatos = {workerID: this.jatos.workerId, responseID: this.jatos.resultId}

      try {
        await this.jatos.submitResultData(resultData)
        resolve(resultData)
      } catch (e) {
        reject(e)
      }
    })
  }

  async endStudy(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (!this.onJATOS)
        reject()

      await this.jatos.endStudyAndRedirect(this.redirectURL)
      resolve()
    })
  }

  private addAbortButton(callback: InitializeParameters["callback"]) {
    if (document.querySelector("#quit-study")) return

    console.log("Adding abort button.")

    try {
      let abortBtn = document.createElement("button")
      abortBtn.id = "quit-study"
      abortBtn.type = "button"
      abortBtn.innerText = "Quit Study"
      abortBtn.addEventListener("click", () => {
        let abort = confirm("Are you sure you want to quit? You will not be compensated for this study if you do.")

        if (callback) {
          callback(this.jatos);
        }

        if (abort)
          this.jatos.abortStudy("Aborted")
      })

      document.body.appendChild(abortBtn)
    } catch (e) {
      console.error("Failed to add abort button.")
    }
  }
}

export default JATOSExtension;
