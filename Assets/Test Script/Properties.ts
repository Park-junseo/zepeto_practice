///import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Vector3, GameObject, Transform} from 'UnityEngine'

export default class Properties extends ZepetoScriptBehaviour {

    public floatValue: float;
    public intValue: int;
    public strValue: string;

    public vectorValue:Vector3;

    public gameObjectValue: GameObject;
    public transformValue: Transform;

    public floatValues: float[];

    // Serialize가 불필요한 public Property
    @NonSerialized()
    public strValue1:string;
 
    // Inspector 상에 노출하고 싶지 않은 Property
    @HideInInspector()
    public strValue2:string;
 
    // Serialize가 필요한 private Property
    @SerializeField()
    private strValue3:string;
 
    // Property 위에 헤더 추가
    @Header("Header Title")
    public stringProperty: string;
 
    // Property 간 간격 추가
    @Space(10)
    public transformProperty: Transform;
 
    // Property에 마우스가 위치하는 경우 나타나는 툴팁 추가
    @Tooltip("This is Tooltip")
    public numberProperty: number;

    Update() 
    {
        //console.log(`floatValue : ${this.floatValue}`);
        //console.log(`strValue : ${this.strValue}`);
        // rotate cube a
        if(this.gameObjectValue)
        {
            var transform = this.gameObjectValue.GetComponent<Transform>();
            transform.Rotate(this.vectorValue * 2);
        }
        else {
            console.warn("null gameobject");
        }
        
        // rotate cube b
        if(this.transformValue)
        {
            this.transformValue.Rotate(this.vectorValue);
        }
        else
        {
            console.warn("null transform");
        }
      
        
    }

}