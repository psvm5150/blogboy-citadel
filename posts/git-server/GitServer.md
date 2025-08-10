### 1. 개요

Git을 활용하여 다양한 개발 관련 업무에서 형상관리를 할 수 있다. Harvest 와는 다르게 빠르고 IDE나 Editor 와 같은 도구에 통합되어 있어  보다 편리하게 쓸 수 있다. 또한 인터넷에서 Reference를 쉽게 찾을 수 있으며 현 시점에서 사실상 형상관리의 표준 이라 할 수 있다. 그리고 우리도 차세대 업무에서 Git을 표준 형상관리 도구로 사용하게 될 것이다. 

하지만 사내에 Git Server가 따로 있지 않아 대부분 PC의 Local 환경에서만 사용 가능하여 협업 등 Git 의 많은 장점을 사용 할 수 없다. Git 은 빠르고 가벼우면서도 다양한 도구들을 가지고 있다. 특히 Linux에서는 Git Client를 설치 하는 것만으로도 신기하게도 이미 Git Server를 운영 할 수 있는 준비가 되어 있다.

아무런 설치도 하지 않고 쉽게 내가 원하는 Git Server 저장소를 만들고 운영 해보자. 우리는 관리망에서 작업하므로 개발서버 `devwas-10.33.110.118` 에 계정만 있으면 할 수 있다. 원하면 협업도 할 수 있고 굳이 Gitlab 이나 Github를 사용하지 않고 Git Server의 기능을 쓸 수 있다.  

본 문서에 기재된 Git Server 는 다음 목적으로 사용 시 매우 유용 하다. 

  * 개인적으로 업무 관리하는 Source 등에 대해 형상관리 하고 싶다.
  * 팀 내 또는 소규모 프로젝트에서 형상관리 서버로 사용한다.
  * Git / Git Flow 를 학습하거나 차세대 업무 등을 위해 테스트 한다.  

Git 사용법 기초에 대한 내용은 본문서에서 다루지 않는다. 앞으로 Git 형상관리 기초에 대해 Quick Start 형식의 가이드를 작성할 예정이다. 

<br> 

### 2. 인증서 설정

  1. 관리망 PC에 Git Client 설치  
    Git Client 가 설치되지 않은 경우 관리망 PC에 아래 링크의 파일을 설치한다. 설치 3번째 페이지에 나오는 Default Editor 설정은 원하는 에디터로 하고 나머지 대부분은 기본값으로 설치해도 무방하다.  

    [Git-2.40.0-64bit](./Git-2.40.0-64-bit.zip)  

    설치 후 Git Bash 를 실행 시켜 다음 설정을 한다. 바로 하지 않으면 개발 도구 연동 시 에러가 뜨거나 문제를 발생 시킨다.
    ```bash
    git config --global user.name "안진모(9000651)"
    git config --global user.email "genemo.ahne@axa.co.kr"
    git config --global --list
    ``` 

  2. PC에 인증서 만들기  
    개발서버와 관리망 PC가 인증서로 연결되어 있지 않은 경우 아래 링크의 1장의 1~3번 절차에 따라 Local PC에 인증서를 생성 한다. 1장 4번 항목 이후  PPK 인증서는 본 과정에서 필요 없다.  

    [개발 도구 인증서 적용 가이드](https://devlap.axa.co.kr/devdocs/cert)

  3. SSH config 파일 만들기    
    Windows의 사용자 home 디렉토리에 .ssh 파일을 만든다. 이미 만들어져 있는 경우 해당 디렉토리를 사용한다.  
      예: `C:\사용자\master\.ssh` 

      ```
      home 디렉토리 확인:   
        바탕화면 사용자명 폴더 > 폴더 내 아무 디렉토리 우측클릭 > 속성 > 위치  
        C:\Users\master 인지 C:\Users\사번  인지 확인 
      ```

    plaintext 로 config 파일을 만들고 아래와 같이 작성한다.  
    예: `C:\사용자\master\.ssh\config` 

    ```
    HostkeyAlgorithms +ssh-rsa
    PubkeyAcceptedAlgorithms +ssh-rsa
    IdentityFile /c/workdir/.ssh/9000651_id_rsa
    ``` 

    * IdentityFile 에 PC에서 만든 개인키 위치와 이름을 기술 해 준다.
    * C:\사용자\master\\.ssh\id_rsa 란 이름으로 개인키가 있는 경우만 IdentityFile 설정을 생략 할 수 있다.
    * IdentityFile 의 path 기술이 unix 스타일 처럼 되어 있다. 이는 Windows용 bash에서 사용되기 때문이다.  


  4. 개발 서버에 공개키 넣기  
    개발서버와 관리망 PC가 인증서로 연결되어 있지 않은 경우 아래 링크의 2장의 절차에 따라 PC에서 만든 공개키를 개발서버에 적용 한다. 

    [개발 도구 인증서 적용 가이드](https://devlap.axa.co.kr/devdocs/cert)

    그리고 협업하고자 하는 동료가 있다면 공개키를 받아 해당 계정에 동일한 방식으로 `authorized_keys` 에 추가 한다.

<br> 

### 3. 서버에 Repository 만들기

개발서버(`10.33.110.118`) 로 로그인 해 Git Repository 용으로 쓸 디렉토리를 만든다. 이 디렉토리에는 이제 여러 Git Project 가 들어 갈 수 있다. Repository 이름은 아무 이름이나 해도 상관 없다.  그리고 `git init --bare` 명령어를 사용해 Git Project 를 만든다.

  ```bash
  mkdir repos
  cd repos
  git init --bare UltraCaptiongApp.git
  ```

성공하면 아래와 같이 나오면서 Git Project 가 만들어진다.

  ```bash
  [kba9000651@devwas repos]$ git init --bare UltraCaptiongApp.git
  Initialized empty Git repository in /home/users/kba9000651/repos/UltraCaptiongApp.git/
  ```

자 이제 아래와 같은 형식의 origin 주소를 사용할 수 있다. Local Project 와 대응하는 원격지(remote) 를 origin 이라고 한다. 
  ```bash
  ssh://kba9000651@10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git
  ```

<br> 
용어가 잘 이해가 안 간다면 아래와 같이 Harvest Workbench를 열고 비교해 보자. 
 
 | 용어 | Harvest | Git | 
|----|------|-----|
| Repository | scmsvr | repos |
| Project  | AP_Local | UltraCaptiongApp.git |
| State/Branch  | 변경작업, 긴급적용, 적용작업, 작업완료 | develop, hotfix, release, master |

생각보다 간단한 개념이다. 심지어 Repository, Project 는 Git 과 Harvest 가 동일한 용어를 사용하며, Branch 개념을 Harvest에서 State(단계) 로 표현한 부분만 다르다. 참고로 SVN(Subversion) 도 동일한 개념과 용어를 사용한다.     

<br> 

### 4. PC에 Git Project 만들고 연결하기

형상관리하고자 하는 Eclipse/IntelliJ 프로젝트 또는 디렉토리를 정하고 Git Bash 를 실행 시킨다. 그런 후 아래와 같이 Git 형상관리 초기화 및 commit 을 수행한다. 특이한 것은 윈도우즈의 Path를 Unix 스타일의 Path로 변경하여 사용한다. `git init` 후 PC의 Local 에서 git 형상관리가 시작 된다.

```bash
cd /c/workdir/UltraCaptiongApp
git init
git add .
git commit -m 'initial commit'
```

이제 origin 과 연결하자.  
각 Project 는 대응하는 1개의 origin 만 가질 수 있다.  

```bash
git remote add origin ssh://kba9000651@10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git
```

현재 Project가 어떤 origin 을 바라보고 있는지 확인할 수 있다.

```bash
$ git remote -v
origin  kba9000651@10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git (fetch)
origin  kba9000651@10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git (push)
```

Local Project의 내용을 원격지에 밀어넣자(push).

```bash
$ git push origin master
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Delta compression using up to 16 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 253 bytes | 126.00 KiB/s, done.
Total 3 (delta 1), reused 0 (delta 0), pack-reused 0
To ssh://10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git
   e78ebe3..920c76c  master -> master
```

끝이다.  
<br>
이제 `변경 > git add > git commit > git push` 를 무한 반복 하여 형상관리 하면 된다.  
이해를 돕기 위해 명령어로 설명 하였으나 대부분의 IDE나 Sublime Text와 같은 Editor 에서는 Git 과 연동이 가능하여 Tool 내 단축키나 메뉴로 명령어 대신 편리하게 사용이 가능하며, Git 변경상태에 대해서도 실시간으로 표시된다.  

<br> 

### 5. 원격 저장소 관리

1. 대상 origin 변경  
  PC의 bash 에서 아래와 같이 remove 로 삭제했다가 `git remote add` 명령어를 사용 한다.  
  ```bash
  cd /c/workdir/UltraCaptiongApp
  git remote remove origin
  git remote add origin ssh://kba9000651@10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git
  git remote -v
  ```

2. origin 내 저장소 삭제  
  ```bash
  rm -rf ./UltraCaptiongApp.git 
  ```  

    > 더 이상의 자세한 설명은 생략 한다.

3. origin 백업   
  개발서버의 이전, 다른 계정/서버로 Project를 이전 또는 서버 장애에 대비 등 여러 목적으로 원격지 origin 의 백업 이 필요 할 수 있다. 특히 프로젝트가 시작되면 이 과정을 스케쥴링 가능한 도구로 자동화 하여 관리하면 보다 효율적이다. 
  ```bash
  $ cd /C/workdir/tmp/backup

  $ git clone --mirror ssh://kba9000651@10.33.110.118/home/users/kba9000651/repos/UltraCaptiongApp.git
  Cloning into bare repository 'UltraCaptiongApp.git'...
  remote: Counting objects: 33, done.
  remote: Compressing objects: 100% (31/31), done.
  remote: Total 33 (delta 6), reused 0 (delta 0)
  Receiving objects: 100% (33/33), 644.15 KiB | 7.40 MiB/s, done.
  Resolving deltas: 100% (6/6), done.
  ```

4. origin 복구   
  아래 예제는 PC에 백업 된  `UltraCaptiongApp.git` 을 new_repos 위치로 옯기는 예제 이다.  
  옮길 곳의 Repository 에 bare project 를 먼저 만들어야 한다.
  ```bash
  $ cd new_repos/
  $ git init --bare UltraCaptiongApp.git
  Initialized empty Git repository in /home/users/kba9000651/new_repos/UltraCaptiongApp.git/
  ```
  그런 후 아래와 같이 PC에서 `new_repos` 로 origin을 변경 한 후 백업 된 Project 를 push 한다.
  ```bash
  $ cd /C/workdir/tmp/backup/gitdemo.git 

  $ git remote set-url --push origin ssh://kba9000651@10.33.110.118/home/users/kba9000651/new_repos/UltraCaptiongApp.git

  $ git remote -v
  origin  ssh://kba9000651@10.33.110.118/home/users/kba9000651/new_repos/UltraCaptiongApp.git (fetch)
  origin  ssh://kba9000651@10.33.110.118/home/users/kba9000651/new_repos/UltraCaptiongApp.git (push)

  $ git push --mirror
  Enumerating objects: 33, done.
  Counting objects: 100% (33/33), done.
  Delta compression using up to 16 threads
  Compressing objects: 100% (25/25), done.
  Writing objects: 100% (33/33), 644.15 KiB | 37.89 MiB/s, done.
  Total 33 (delta 6), reused 33 (delta 6), pack-reused 0
  To ssh://10.33.110.118/home/users/kba9000651/new_repos/UltraCaptiongApp.git
   * [new branch]      master -> master
  ```

<br> 

### [부록] Sublime Text 의 Git 연동

  1. Plugin 설치  
    Sublime Text의 Git 연동을 위해 아래 파일을 받아 압축을 해제 한다.  
    [SublimeGit-1.0.37](./SublimeGit.zip)

    `SublimeGit.sublime-package` 파일을 다음 위치에 복사한다.   
    ```
    C:\Users\master\AppData\Roaming\Sublime Text\Installed Packages
    또는 C:\Users\사번\AppData\Roaming\Sublime Text\Installed Packages
    ```

  2. Plugin 설정
    메뉴: `Preferences > Package Settings > SublimeGit > Settings - User` 

    원하는 Charater Set 및 실패 시 대안으로 찾을 Set을 지정 후 저장
    ```json
    {
        "encoding": "utf-8",
        "fallback_encodings": ["euc-kr", "cp949"]
    }
    ```

  3. 형상관리 연동  
    `C:\workdir\UltraCaptiongApp` 에 형상관리를 시작 하는 것을 전제 한다.  
    아무 폴더나 만들고 파일 몇 개를 넣은 후 테스트 해 보자. 

    `CTRL+SHIFT+P > Git: init` 
    ```
    Directory: C:\workdir\UltraCaptiongApp 
    ```

    왼쪽 사이드 바에 UltraCaptiongApp 디렉토리 및 파일에 ○ 표시가 되어 있다. 이것은 형상관리가 연동 되었음을 의미 한다.

  4. Local Git 에 Commit    
    UltraCaptiongApp 파일을 하나 열고 그 화면에서 명령을 실행 한다.  

    `CTRL+SHIFT+P >  Git: Quick Add > Add All Files`  
    Side Bar의 아이콘이 Staging 영역 아이콘으로 변경된다.

    `CTRL+SHIFT+P >  Git: Commit`  
    새로 열린 Commit 화면에서 Commit Message 를 입력하고 저장하고 닫는다.  왼쪽 사이드 바에 아이콘이 없어진 것을 확인 할 수 있다.  

  5. origin 설정 및 push  
     `CTRL+SHIFT+P > Git: Add Remote` 
     ```
     Name: origin
     Url: ssh://kba9000651@10.33.110.118/home/users/kba9000651/new_repos/UltraCaptiongApp.git
     ```
     입력 후 상단에 `origin 연결 주소` > `Show` 선택 하면 하단 콘솔에서 성공 여부를 알 수 있다.

     만약 실패하거나 잘 못 입력 했으면  `CTRL+SHIFT+P >  Git: Remote` 명령으로 현재 origin을 선택 한 뒤 삭제하거나 수정 할 수 있다.

     `CTRL+SHIFT+P >  Git: Push`  
     ```
     Remote Branch: master   
     ```