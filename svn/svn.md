Subversion(SVN) 형상관리 Guide
===================  
<br> <br> <br> <br> <br> <br> <br> <br>
  
  >   * `author by 안진모`    
  >   * `up to date 2023.06.29` 
    
<br>
<br>
  Copyright ⓒ2023 AXA General Insurance Korea Co.,Ltd. All Right Reserved.

<br>  
--------------------------------------
<br>  

### 목차
<br>
  > &nbsp; [1. SVN Repository 생성 요청](#1-svn-repository)   
  > &nbsp; [2. Tortoise SVN 을 통한 저장소 최초 등록](#2-tortoise-svn)   
  > &nbsp; [3. IntelliJ IDEA 에서 SVN 사용](#3-intellij-idea-svn)   
  > &nbsp; [4. SVN 원격 Repository 관리 작업](#4-svn-repository)  

  <br> <br> <br> <br>
--------------------------------------


<br>

### 1. SVN Repository 생성 요청
아키텍처 팀에 SVN Repository 생성 요청을 한다. 
사용 신청 후 아래와 같은 형식의 주소를 부여 받게 된다.
```
svn://jenkins.axa.co.kr/{repo_name}

``` 

하나의 SVN 저장소를 생성하면 그 이하에는 여러 Project 들이 위치 할 수 있다.  
예를 들면 `axa` 라는 저장소를 만들고 `svn://jenkins.axa.co.kr/axa` 내 아래와 같이 개별 Project가 위치 한다.
```

svn://jenkins.axa.co.kr/axa/ECM
svn://jenkins.axa.co.kr/axa/H2oDaemonServer
```
물론  `svn://jenkins.axa.co.kr/axa`  를 하나의 프로젝트 용으로 사용 할 수도 있다.

그리고 사용자 명단(사번)과 권한(읽기전용/쓰기 여부)에 대한 내용도 같이 요청 해야 한다.  
<br/>

### 2. Tortoise SVN 을 통한 저장소 최초 등록

IntelliJ 나 Eclipse 등 에서 직접 SVN Repository 에 등록 가능 하지만 문제점이 한 가지 있다.  
`VCS` >  `Enable Version Control Integration` 을 통해 Subversion 과 연동 할 수 있다. 하지만 이 때 Project 내 모든 파일들이(예: `.idea`, `*.iml` 등) 이 같이 원격 저장소에 먼저 추가 되고 그 후에 set property 에서 svn:ignore 를 설정 할 수 있다.    

SVN의 특성은 Remote에 버전 관리 대상으로 지정된 파일이나 디렉토리는 이후 svn:ignore 에 설정 되어도 ignore가 무시된다. 따라서 사용자별로 각기 다른 프로젝트 설정이나 계속 변경되는 IntelliJ의 설정 파일등이 계속 Commit을 요구 받게 되는 상황이 발생 한다. 이를 피하기 위해 PC에서 Tortoise SVN으로 버전관리 대상 파일 만을 먼저 원격 저장소에 추가 하고 IntelliJ에서 해당 소스를 불러와 프로젝트를 생성 하는 편이 보다 합리적이다. 
> ※ Eclipse 나 VS Code 사용시도 동일한 문제가 발생 한다.  

<br/>
##### 저장소 등록 
1. TortoiseSVN Download 및 설치  
[TortoiseSVN-1.14.5.29465-x64](./TortoiseSVN-1.14.5.29465-x64-svn-1.14.2.msi)

2. 형상 대상 선정  
임의 디렉토리 생성 후 SVN에 등록 할 파일만 정리해서 위치 시킨다.  

3. 형상 파일의 원격 저장소 추가  
프로젝트 전체 폴더가 아닌 프로젝트 폴더 1단계 안쪽의 각 파일 및 디렉토리를 개별로 등록 해준다.  
등록대상 선택 > 우측 클릭 > `TortoiseSVN` > `Import` > `URL of Repository` 의 `...` 버튼을 클릭하여 원하는 위치를 지정 > `Recent messages` 에 내용을 입력 > `OK`
 

<br/>

### 3. IntelliJ IDEA 에서 SVN 사용  
IntelliJ IDEA를 기준으로 설명하지만 사실 Eclipse 나 VS Code 도 동일한 과정으로 사용 가능하다. 메뉴명과 복사할 설정파일이 약간 다른 정도고 그 외 나머지 과정은 모두 대동소이하다. 

#### 3.1 기존 SVN 프로젝트가 있는 경우
1. SVN 연결 중지  
`SVN` > `SVN Disconnect`  
> ※ SVN Disconnect 는 별도 Plugin을 설치 해야 사용 할 수 있다.    
> [SVNDisconnect](SVNDisconnect.jar)
2. IntelliJ IDEA 종료  
3. 프로젝트 폴더 rename  
ideaProjects 내 Project 폴더 명을 Rename  
4. IntelliJ IDEA 구동 및 Project 생성  
`Get from VCS` > `Version Control: Subversion` > `Project의 trunk 를 선택` > `Check out` 
5. 대상 디렉토리 지정  
`Destination Directory`  팝업에서 `ideaProjects`를 선택 > `OK` > `C:\idea\IdeaProjects\{프로젝트명}` 선택 > `OK`
6. Project 생성 작업 완료 > IntelliJ IDEA 종료  
7. Project 설정 파일 복원  
3항에서 rename 한 기존 Project에서 다음 파일을 복사하여 현재 SVN으로 부터 새로 생성 된 Project에 복사 한다.   
 - Project root의 `.iml` 복사   
 - 각 Module root의 `.iml` 복사 
<br/>

#### 3.2 신규 프로젝트 생성
1. SVN 설정  
Slik SVN의 위치를 지정 한다.  
- `Settings` > `Version Control` > `Subversion` > `Path to subversion executable` :  C:\idea\apps\sliksvn-1.14.2\bin\svn.exe  
- `Use custom configuration directory` :  C:\idea\svn (Optional) 

1. 프로젝트 생성
 `File` > `New` > `Project from Version control` >  `Version Control: Subversion` > `Project의 trunk 를 선택` > `Check out` 
2. 대상 디렉토리 지정  
`Destination Directory`  팝업에서 `ideaProjects`를 선택 > `OK` > `C:\idea\IdeaProjects\{프로젝트명}` 선택 > `OK`

<br/>

#### 3.3 svn:ignore 등록
기존 프로젝트 있는 경우, 신규 생성 상관없이 공통적으로 아래 내용을 수행한다. 

1. svn:ignore property 적용  
IntelliJ IDEA 구동 > 좌측 상단 Project root 선택 > `SVN` > `Subversion` > `Set Property` > `svn:ignore` > `OK`  > 아래 내용을 넣고 `OK`
```
*.class
*.iml
*.[Ll][Oo][Gg]
*.[Bb][Aa][Kk]
out
.idea
target
desktop.ini
.harvest.sig
harvest.sig
.scmignore
.settings
.project
*.swp
.DS_Store
[Tt]humbs.db
workspace.xml
bin
```
> Project 내 Module 존재 시 각 모듈 root 를 선택 후 같은 작업을 수행한다.
> `svn:ignore`  설정 시 recursive 체크 하지 말 것

2. 변경 내용 commit  
Project root 및 각 모듈 디렉토리 설정 변경에 대한 commit 이 필요하다. commt 후 변경 내역에 아무것도 뜨지 않으면 모든 설정이 완료 된다.  
<br/>

### 4. SVN 원격 Repository 관리 작업
본 장은  SVN 원격 서버의 Repository 설치 및 운용을 위한 가이드다. Linux/Unix 서버에서 svnserve 사용을 전제로 설명 한다. 아래 절차는 모두 root 권한으로 작업 해야 한다.  
`/home/svn_repos` 를 서버의 저장소 root 로 하고 ap_uiux 저장소 생성을 예로 든다.

#### 4.1 SVN 설치
svnserve 는 Subversion(SVN) 패키지에 포함되어 있다.  아래와 같이 OS 의 설치 명령어로 간단하게 설치 할 수 있다. 
```bash
## CentOS/RHEL
yum install subversion
## MacOS
brew install subversion
## Ubuntu
apt-get install subversion
```

이하 CentOS/RHEL Linux 를 기준으로 설명 한다.

1. SVN 저장소로 쓸 폴더를 만든다.
```bash
mkdir /home/svn_repos
```
2. svnserve 설정 파일을 편집하여 저장소 위치를 지정 한다.  
/etc/sysconfig/svnserve
```bash
# OPTIONS is used to pass command-line arguments to svnserve.
#
# Specify the repository location in -r parameter:
OPTIONS="-r /home/svn_repos"
```

3. 시스템 서비스(systemd) 등록을 위해 등록 스크립트를 작성 한다.  
/usr/lib/systemd/system/svnserve.service
```bash
[Unit]
Description=Subversion protocol daemon
After=syslog.target network.target

[Service]
Environment=LANG=ko_KR.EUC-KR
Type=forking
EnvironmentFile=/etc/sysconfig/svnserve
ExecStart=/usr/bin/svnserve --daemon --pid-file=/run/svnserve/svnserve.pid $OPTIONS

[Install]
WantedBy=multi-user.target
```

4. OS구동시 자동시작을 활성화 한다.
```bash
## 자동시작 등록
systemctl enable svnserve
## 확인
systemctl -l | grep svn
## 구동
systemctl start svnserve
## 확인
systemctl status svnserve
```
<br/>  

#### 4.2 SVN 저장소 생성
1. Repo 생성
```bash
 svnadmin create --fs-type fsfs /home/svn_repos/ap_uiux
```

2. 저장소 설정
```bash
cd  /home/svn_repos/ap_uiux

vi conf/svnserve.conf  
##아래 4가지 항목 주석해제 및 설정
anon-access = none
auth-access = write
password-db = passwd
authz-db = authz
```

3. 사용자 등록
```bash
cd  /home/svn_repos/ap_uiux
vi conf/passwd 

##사용자 추가 및 수정

[users]
admin = admin#1566
9100061 = axa123
9100062 = axa123
9100063 = axa123
9100064 = axa123
9100065 = axa123
```    

4. 권한 설정
```bash
vi conf/authz  

##사용자 또는 그룹별료 권한을 부여한다.

[groups]
uiux = 9000063, 9100064,  9100065,  9100066
axadev = 9100061, 9100062

[/]
admin = rw
@uiux = r
@axadev = rw

[/backup]
* = r
 [/]
 * = rw
```

4. 기본 Dir 생성  
SVN Repo.의 기본 디렉토리 구조를 생성 한다. 
```bash
  svn mkdir --parents svn://127.0.0.1/ap_uiux/trunk 
  svn mkdir --parents svn://127.0.0.1/ap_uiux/branches
  svn mkdir --parents svn://127.0.0.1/ap_uiux/tag
```

5. 접속
```bash
 svn://10.33.110.162/ap_uiux 
 또는  svn://jenkins.axa.co.kr/ap_uiux 
```   
<br/>  
  
#### 4.3 SVN 저장소 백업 및 복구

1. SVN dump  백업
```bash
svnadmin dump ./ap_uiux/ > ./ap_uiux_20201215.dump  
```

2. 복구 할 Repo 생성
```bash
svnadmin create --fs-type fsfs /home/svn_repos/ap_uiux_restore
```
  
3. svn dump 복원
```bash
svnadmin load ./ap_uiux_restore/ < ./ap_uiux_20201215.dump 
```
<br/>  
  
#### 4.4 SVN 저장소 조회

명령어 실행 시 마다 password 묻는것을 방지하기 위해 명령어를 실행 할 계정에서 아래와 같이 설정 한다.  
```bash
vi $HOME/.subversion/servers 
## 다음 두 가지 값을 주석풀고 yes로 바꾼다.
store-passwords = yes
store-plaintext-passwords = yes
```

기본정보 확인
```bash
svn list svn://jenkins.axa.co.kr/ap_uiux/2020_UIUX_AP_Project
svn info svn://jenkins.axa.co.kr/ap_uiux/2020_UIUX_AP_Project
```

저장소 별 전체 형상 목록 출력
```bash
## 전체 목록 출력
svn ls -R svn://jenkins.axa.co.kr/ap_uiux/2020_UIUX_AP_Project
## 전체 파일 목록 출력
svn ls -R -v svn://jenkins.axa.co.kr/ap_uiux/2020_UIUX_AP_Project | grep -v "\/$" | sort
```