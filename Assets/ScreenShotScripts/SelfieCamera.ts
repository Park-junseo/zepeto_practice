import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Vector3, Transform, Mathf, Time, Quaternion, HideFlags, GameObject, Input, Application } from 'UnityEngine'
import { EventSystem } from 'UnityEngine.EventSystems';
import { Position } from 'UnityEngine.UIElements';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { TransformAccess } from 'UnityEngine.Jobs';
export default class SelfieCamera extends ZepetoScriptBehaviour {
    
    public rightOffset: number = 0.25;
    public distance: number = 0.7;
    public height: number = 0.893;
    public xMouseSensitivity: number = 12;
    public yMouseSensitivity: number = 12;
    public yMinLimit: number = -20;
    public yMaxLimit: number = 40;
    public smoothCameraRotation: number = 10;

    public grip: GameObject;
    private currentTarget: Transform;
    private targetLookAt: Transform;
    private currentTargetPos: Vector3;
    private currentPos: Vector3;
    private xMinLimit: number = -180;
    private xMaxLimit: number = 180;
    private rotateX: number = 0;
    private rotateY: number = 0;

    private worldCamaraParent: Transform;
    private worldCameralookAxias: Quaternion;

    public GetGripObject() :GameObject {
        return this.grip;
    }

    public RotateCamera(x: number, y: number) {
        this.SetCameraRotation(this.rotateX + x * this.xMouseSensitivity, this.rotateY - y * this.yMouseSensitivity);
    }

    public SetCameraRotation(x: number, y: number) {
        this.rotateX = this.ClampAngle(x, this.xMinLimit, this.xMaxLimit);
        this.rotateY = this.ClampAngle(y, this.yMinLimit, this.yMaxLimit);
    }

    private ClampAngle(angle: number, min: number, max: number): number {

        if (angle < -180) {
            angle += 360;
        }

        if (angle > 180) {
            angle -= 360;
        }

        return Mathf.Clamp(angle, min, max);
    }


    private CameraMovement() {
        if (this.currentTarget == null)
            return;

        let newRot: Quaternion = Quaternion.Euler(this.rotateY, this.rotateX, 0);
        this.targetLookAt.rotation = Quaternion.Slerp(this.targetLookAt.rotation, newRot, this.smoothCameraRotation * Time.deltaTime);

        var camDir: Vector3 = (this.targetLookAt.forward * -1) + (this.targetLookAt.right * this.rightOffset);
        camDir = camDir.normalized;

        var targetPos = new Vector3(this.currentTarget.position.x, this.currentTarget.position.y, this.currentTarget.position.z);
        this.currentTargetPos = targetPos;

        this.currentPos = this.currentTargetPos + new Vector3(0, this.height, 0);

        this.targetLookAt.position = this.currentPos;
        this.transform.position = this.currentPos + (camDir * this.distance);

        var lookPoint: Vector3 = this.currentPos + this.targetLookAt.forward * 2;
        lookPoint = lookPoint + (this.targetLookAt.right * Vector3.Dot(camDir * (this.distance), this.targetLookAt.right));


        let subtractionVec = new Vector3(lookPoint.x - this.transform.position.x,
            lookPoint.y - this.transform.position.y,
            lookPoint.z - this.transform.position.z);
        var rotation = Quaternion.LookRotation(subtractionVec);

        this.transform.rotation = rotation;

        //this.currentTarget.LookAt(this.transform);
        //this.currentTarget.eulerAngles = new Vector3(0, this.currentTarget.eulerAngles.y, 0);
        
        var lookAxisRot = Quaternion.LookRotation(subtractionVec*-1);
        var projRot = Vector3.ProjectOnPlane(lookAxisRot.eulerAngles, Vector3.right);

        this.currentTarget.rotation = Quaternion.Euler(projRot);

        //console.log(`[SelfieCamera] ${this.currentTarget.rotation.eulerAngles.ToString()}`)

        var lookAxisRot = Quaternion.LookRotation(subtractionVec);

        this.worldCameralookAxias = lookAxisRot;
        //ZepetoPlayers.instance.ZepetoCamera.rotation.eulerAngles = (subtractionVec);



    }

    public InitSetting(target: Transform) { // 플레이어 transfrom
        this.currentTarget = target;

        this.currentTargetPos = new Vector3(this.currentTarget.position.x, this.currentTarget.position.y, this.currentTarget.position.z);

        this.worldCamaraParent = ZepetoPlayers.instance.ZepetoCamera.cameraParent;

        // if (this.targetLookAt != null) {

        //     GameObject.Destroy(this.targetLookAt.gameObject);
        // }

        // this.targetLookAt = this.targetLookAt || new GameObject("targetLookAt").transform;
        // this.targetLookAt.position = this.currentTarget.position;
        // this.targetLookAt.hideFlags = HideFlags.HideInHierarchy;
        // this.targetLookAt.rotation = this.currentTarget.rotation;

        // this.rotateY = this.currentTarget.eulerAngles.x;
        // this.rotateX = this.currentTarget.eulerAngles.y;

    }

    CameraInput() {

        if (!Input.GetMouseButton(0) || Input.touchCount >= 2) {
            return;
        }

        if (EventSystem.current.IsPointerOverGameObject())
            return;

        let X: number = 0;
        let Y: number = 0;

        if (!Application.isEditor) {
            Y = Input.touches[0].deltaPosition.y;;
            X = Input.touches[0].deltaPosition.x;
        } else {
            Y = Input.GetAxis("Mouse Y");
            X = Input.GetAxis("Mouse X");
        }

        this.RotateCamera(X, Y);
    }

    private worldCameraSetting () {
        if(this.worldCameralookAxias)
            this.worldCamaraParent.rotation = this.worldCameralookAxias;
    }

    OnEnable() {
        if(this.currentTarget) {
            this.targetLookAt = this.targetLookAt || new GameObject("targetLookAt").transform;

            this.targetLookAt.position = this.currentTarget.position;
            this.targetLookAt.hideFlags = HideFlags.HideInHierarchy;
            this.targetLookAt.rotation = this.currentTarget.rotation;

            //const inverse = this.currentTarget.forward;
            //const inverse = Quaternion.Inverse(this.currentTarget.rotation).eulerAngles;
            // const inverse = Quaternion.Euler(this.currentTarget.eulerAngles * -1).eulerAngles;

            // this.rotateX = this.currentTarget.rotation.eulerAngles.x;
            // this.rotateY = this.currentTarget.rotation.eulerAngles.y;
            // this.rotateX = this.currentTarget.rotation.eulerAngles.x;
            // this.rotateY = this.currentTarget.rotation.eulerAngles.y;

            //const inverse = Quaternion.Inverse(this.currentTarget.rotation).eulerAngles;

            // this.rotateY = this.currentTarget.eulerAngles.x;
            // this.rotateX = this.currentTarget.eulerAngles.y;

            this.rotateY = this.currentTarget.eulerAngles.x;
            this.rotateX = this.currentTarget.eulerAngles.y - 180;
            console.log(`[onEnable] ${this.rotateY},${this.rotateX}`);
            
        }
    }
    LateUpdate() {

        if (this.currentTarget == null || this.targetLookAt == null)
            return;

        this.CameraInput();
        this.CameraMovement();
    }

    Update() {
        if (this.currentTarget == null || this.targetLookAt == null)
            return;
        this.worldCameraSetting();


    }
}