// AWS SDK를 로드합니다.
const { EC2Client, DescribeInstancesCommand, StopInstancesCommand } = require("@aws-sdk/client-ec2");
// logger 로드
const logMessage = require('./logger');

// auto_stop 태그에 value가 enable이 아닌 경우 자동 중지
// EC2 서비스 객체 생성
const client = new EC2Client({ region: "ap-northeast-2" });

async function stopEC2Instances() {
    const command = new DescribeInstancesCommand({
        Filters: [
            {
                Name: "instance-state-name",
                Values: ["running"]
            }
        ]
    });

    try {
        // 중지 리스트 저장
        let stopInstanceList = new Array();
        const data = await client.send(command);
        data.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
                const instanceId = instance.InstanceId;
                const existTag = instance.Tags.find(tag => tag.Key === 'NO_AUTO_STOP');
                if (!existTag || existTag.Value.toLowerCase() !== 'enable') {
                    stopInstanceList.push(instanceId);
                    logMessage('info', `get stop instance id: ${instanceId} - reason(no tag)`, 'ec2.js');
                }
            });
        });

        await client.send(new StopInstancesCommand({ InstanceIds: stopInstanceList }));
        logMessage('info', `success stop instances: ${stopInstanceList}`, 'ec2.js');
    } catch (error) {
        logMessage('error', `error: ${error}`, 'ec2.js');
    }
}

module.exports = stopEC2Instances;