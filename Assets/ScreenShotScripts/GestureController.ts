import { AnimationClip, GameObject, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ClientStarterV2 from '../Multiplay Script/ClientStarterV2';

export default class GestureController extends ZepetoScriptBehaviour {

    public gestureListButtons: Button[];
    public gestureClips: AnimationClip[];

    private static _instance: GestureController;

    Awake() {
        GestureController._instance = this;
    }

    Start() {
        for (let i = 0; i < this.gestureClips.length; ++i) {
            this.gestureListButtons[i].onClick.AddListener(() => {
                this.SendGestureIndex(i);
                this.StopAllCoroutines();
                this.StartCoroutine(this.StopCharacterGesture(this.gestureClips[i].length - 0.3));
            });
        }
    }

    *StopCharacterGesture(length:number) {
        yield new WaitForSeconds(length);
        this.SendGestureIndex(-1);
        // character.CancelGesture();
    }

    private SendGestureIndex(index:number) {
        ClientStarterV2.Instance.SendMessageGestrue(index);
    }

    public static get Instance() {
        if(!GestureController._instance) {

            var _obj = new GameObject("GestureController");
            GameObject.DontDestroyOnLoad(_obj);
            GestureController._instance = _obj.AddComponent<GestureController>();
        }

        return GestureController._instance;
    }

    public StartGesture(character:ZepetoCharacter, animIndex:number) {
        character.CancelGesture();
        if(animIndex>-1) {
            character.SetGesture(this.gestureClips[animIndex]);
        }
    }
}