import { Octokit } from '@octokit/core'
import { Base64 } from 'js-base64'

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN
})

export const getMainBranchSha = async (): Promise<string> => {
  const response = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/{ref}', {
    owner: '14A-A-Lyedlik-Devs',
    repo: 'Gump',
    ref: 'main'
  })
  console.log('GET main branch:', response.status)
  return response.data.object.sha
}

export const getOrCreateBranch = async (branchName: string, sha: string) => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/{ref}', {
      owner: '14A-A-Lyedlik-Devs',
      repo: 'Gump',
      ref: branchName
    })
    // branch exists, return status
    console.log(`GET ${branchName} branch:`, response.status)
  } catch (error) {
    // branch does not exist, create it
    const response = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
      owner: '14A-A-Lyedlik-Devs',
      repo: 'Gump',
      ref: `refs/heads/${branchName}`,
      sha: sha
    })
    console.log('CREATE branch:', response.status)
  }
}

// this is the most utterly fucked up function I have ever written
const getSha = (response: any): string => {
  const jsonString = JSON.stringify(response.data)
  const shaIndex = jsonString.indexOf('"sha":"') + 7
  const sha = jsonString.substring(shaIndex, jsonString.indexOf('"', shaIndex))
  return sha
}

// first try to get the file sha, if it exists update it
// if it does not exist, create it
export const createFileAndCommit = async (
  branchName: string,
  fileName: string,
  content: string,
) => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: '14A-A-Lyedlik-Devs',
      repo: 'Gump',
      path: `locales/${fileName}.json`
    })
    console.log('GET commit', response.status)
    // file exists, update it
    const updateResponse = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: '14A-A-Lyedlik-Devs',
      repo: 'Gump',
      path: `locales/${fileName}.json`,
      message: `${branchName} changed ${fileName}.json`,
      content: Base64.encode(content),
      branch: branchName,
      sha: getSha(response)
    })
    console.log('UPDATE commit:', updateResponse.status)
  } catch (error) {
    // file does not exist, create it
    const createResponse = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: '14A-A-Lyedlik-Devs',
      repo: 'Gump',
      path: `locales/${fileName}.json`,
      message: `${branchName} created ${fileName}.json`,
      content: Base64.encode(content),
      branch: branchName
    })
    console.log('CREATE commit:', createResponse.status)
  }
}

export const createPullRequest = async (branchName: string) => {
  const response = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
    owner: '14A-A-Lyedlik-Devs',
    repo: 'Gump',
    title: `${branchName} committed new translations`,
    head: branchName,
    base: 'main'
  })
  console.log('CREATE pull request:', response.status)
}

export const createPullRequestFromContent = async (
  branchName: string,
  fileName: string[],
  content: string[],
) => {
  const sha = await getMainBranchSha()

  await getOrCreateBranch(branchName, sha)

  await createFileAndCommit(branchName, fileName, content)

  await createPullRequest(branchName)
}
